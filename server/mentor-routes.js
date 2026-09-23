import rateLimit from 'express-rate-limit';
import {
  canBrowseMentors, canRequestMentoring, canOfferMentoring, parseMentorProfile,
  parseMentoringRequest, shouldEmailFullQuestion, uuidPattern,
} from './mentoring-validation.js';

const maxList = 100;
const requestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false });
const cleanText = value => typeof value === 'string' ? value.trim() : '';

/**
 * Server-side verified access only; never return alumni email or legal name to requesters.
 * Email delivery is optional and deliberately excludes the question by default.
 */
export function registerMentorRoutes(app, { supabase, authenticated, route, HttpError, required, privacyPublished = false }) {
  const config = {
    token: process.env.RESEND_API_KEY || '',
    from: process.env.MENTOR_FROM_EMAIL || '',
    site: process.env.SITE_URL || '',
  };
  function canSendEmail() {
    try { return Boolean(config.token && config.from && new URL(config.site).protocol === 'https:'); }
    catch { return false; }
  }
  async function mailUser(userId, subject, body) {
    if (!canSendEmail()) return false;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data?.user?.email) return false;
      const response = await fetch('https://api.resend.com/emails', {
        method:'POST',
        headers:{ Authorization:`Bearer ${config.token}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ from:config.from, to:[data.user.email], subject, text:body }),
        signal:AbortSignal.timeout(6500),
      });
      if (!response.ok) { console.error('[mentoring] mail provider rejected request:', response.status); return false; }
      return true;
    } catch (error) {
      console.error('[mentoring] email delivery unavailable:', error.name);
      return false;
    }
  }
  async function verified(req) {
    const p = await authenticated(req);
    if (!canBrowseMentors(p)) throw new HttpError(403, '승인된 활동·졸업 학회원만 이용할 수 있습니다.');
    return p;
  }
  async function purge() {
    const { error } = await supabase.rpc('purge_mentor_requests');
    required('멘토링 기록 정리 작업에 실패했습니다. 마이그레이션을 확인해 주세요.', error);
  }

  app.get('/api/mentoring/mentors', route(async (req, res) => {
    await verified(req);
    const { data: mentors, error } = await supabase.from('mentor_profiles')
      .select('id,job_field,job_title,introduction,show_cohort,updated_at')
      .eq('accepting_requests',true).order('job_field').limit(maxList);
    required('멘토 목록을 불러오지 못했습니다.',error);
    if (!mentors?.length) return res.json({ mentors:[] });
    const { data: members, error: memberError } = await supabase.from('profiles')
      .select('id,display_name,cohort,is_verified,membership_status')
      .in('id',mentors.map(m=>m.id));
    required('멘토 정보를 불러오지 못했습니다.',memberError);
    const allowed = new Map((members||[]).filter(canOfferMentoring).map(p=>[p.id,p]));
    res.json({ mentors:mentors.filter(m=>allowed.has(m.id)).map(m=>({
      id:m.id, nickname:allowed.get(m.id).display_name,
      cohort:m.show_cohort ? allowed.get(m.id).cohort : null,
      job_field:m.job_field, job_title:m.job_title, introduction:m.introduction,
    })) });
  }));

  app.get('/api/mentoring/profile', route(async (req, res) => {
    const p = await verified(req);
    if (!canOfferMentoring(p)) return res.json({ can_offer:false, mentor:null });
    const { data, error } = await supabase.from('mentor_profiles').select('*').eq('id',p.id).maybeSingle();
    required('멘토 설정을 불러오지 못했습니다.',error);
    res.json({ can_offer:true, mentor:data });
  }));

  app.put('/api/mentoring/profile', route(async (req, res) => {
    const p = await verified(req);
    if (!canOfferMentoring(p)) throw new HttpError(403,'승인된 졸업 학회원만 멘토로 등록할 수 있습니다.');
    const item = parseMentorProfile(req.body);
    if (!item) throw new HttpError(400,'직무, 공개 동의 및 메일 수신 설정을 확인해 주세요.');
    const { data, error } = await supabase.from('mentor_profiles').upsert({
      id:p.id, ...item, consent_at:item.accepting_requests?new Date().toISOString():null,
      updated_at:new Date().toISOString(),
    },{onConflict:'id'}).select('*').single();
    required('멘토 설정을 저장하지 못했습니다.',error);
    res.json({ mentor:data });
  }));

  app.delete('/api/mentoring/profile',route(async(req,res)=>{
    const member=await authenticated(req);
    const {error}=await supabase.from('mentor_profiles').delete().eq('id',member.id);
    required('멘토 정보를 삭제하지 못했습니다.',error);
    res.json({ok:true});
  }));
  app.post('/api/mentoring/requests', requestLimiter, route(async (req, res) => {
    if(!privacyPublished)throw new HttpError(503,'개인정보처리방침이 확정된 후 멘토링 요청이 재개됩니다.');
    const sender = await verified(req);
    if (!canRequestMentoring(sender)) throw new HttpError(403,'현재 활동 중인 학회원만 요청을 보낼 수 있습니다.');
    const item = parseMentoringRequest(req.body);
    if (!item) throw new HttpError(400,'질문(20~2000자) 및 별도 동의 항목을 확인해 주세요.');
    if (item.mentor_id === sender.id) throw new HttpError(400,'본인에게는 요청할 수 없습니다.');
    await purge();
    const { data: mentor, error: me } = await supabase.from('mentor_profiles').select('*')
      .eq('id',item.mentor_id).eq('accepting_requests',true).maybeSingle();
    required('멘토를 확인하지 못했습니다.',me);
    if (!mentor) throw new HttpError(404,'현재 요청을 받는 멘토가 아닙니다.');
    const { data: owner, error: oe } = await supabase.from('profiles')
      .select('id,is_verified,membership_status').eq('id',mentor.id).maybeSingle();
    required('멘토 자격을 확인하지 못했습니다.',oe);
    if (!canOfferMentoring(owner)) throw new HttpError(404,'현재 요청을 받는 멘토가 아닙니다.');
    const dayAgo = new Date(Date.now()-24*60*60*1000).toISOString();
    const { count, error: ce } = await supabase.from('mentor_requests')
      .select('id',{count:'exact',head:true}).eq('requester_id',sender.id).gte('created_at',dayAgo);
    required('요청 횟수를 확인하지 못했습니다.',ce);
    if (count>=3) throw new HttpError(429,'요청은 하루 3건까지 보낼 수 있습니다.');
    const { count:pendingCount,error:pe } = await supabase.from('mentor_requests')
      .select('id',{count:'exact',head:true}).eq('mentor_id',mentor.id)
      .eq('requester_id',sender.id).in('status',['pending','accepted']);
    required('기존 요청을 확인하지 못했습니다.',pe);
    if (pendingCount) throw new HttpError(409,'해당 멘토에게 처리 중인 요청이 이미 있습니다.');
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('mentor_requests').insert({
      mentor_id:mentor.id, requester_id:sender.id,
      requester_nickname:sender.display_name, requester_cohort:item.share_cohort && sender.cohort !== '미지정' ? sender.cohort : null,
      question:item.question, allow_full_email:item.allow_full_email, consent_version:item.consent_version,
      consent_collect_at:now,consent_share_at:now,
    }).select('id').single();
    required('요청을 접수하지 못했습니다.',error);
    let mailSent=false;
    if (mentor.email_notifications) {
      const intro=`SWUFORCE 멘토링 요청이 접수되었습니다.\n신청자: ${sender.display_name}${item.share_cohort?' ('+sender.cohort+'기)':''}\n`;
      const body= shouldEmailFullQuestion(item,mentor)
        ? `${intro}\n질문:\n${item.question}\n\n답변은 홈페이지에서 작성해 주세요.\n${config.site}/mentoring`
        : `${intro}\n질문 내용은 홈페이지 로그인 후 확인해 주세요.\n${config.site}/mentoring`;
      mailSent=await mailUser(mentor.id,'[SWUFORCE] 새로운 멘토링 요청',body);
      if(mailSent) {
        const {error:ue}=await supabase.from('mentor_requests').update({email_notified_at:new Date().toISOString()}).eq('id',data.id);
        if(ue) console.error('[mentoring] email notification metadata not saved');
      }
    }
    res.status(201).json({ id:data.id, notified_by_email:mailSent,
      notice:mailSent?'멘토에게 이메일 알림을 전송했습니다.':'요청이 저장됐습니다. 멘토는 홈페이지에서 확인할 수 있습니다.' });
  }));

  app.get('/api/mentoring/requests', route(async (req,res) => {
    const person=await verified(req);
    await purge();
    const {data,error}=await supabase.from('mentor_requests')
      .select('id,mentor_id,requester_id,requester_nickname,requester_cohort,question,status,answer,created_at,expires_at,closed_at,answered_at')
      .or(`mentor_id.eq.${person.id},requester_id.eq.${person.id}`).order('created_at',{ascending:false}).limit(100);
    required('멘토링 요청을 불러오지 못했습니다.',error);
    const mentorIds=[...new Set((data||[]).map(r=>r.mentor_id))];
    let names=new Map();
    if(mentorIds.length){
      const {data:profiles,error:ne}=await supabase.from('profiles').select('id,display_name').in('id',mentorIds);
      required('멘토 이름을 불러오지 못했습니다.',ne);
      names=new Map(profiles.map(p=>[p.id,p.display_name]));
    }
    res.json({requests:(data||[]).map(r=>({
      ...r,role:r.mentor_id===person.id?'mentor':'requester', mentor_name:names.get(r.mentor_id)||'SWUFORCE 멘토',
    }))});
  }));

  app.patch('/api/mentoring/requests/:id', route(async (req,res) => {
    const person=await verified(req);
    if(!uuidPattern.test(req.params.id)) throw new HttpError(400,'잘못된 요청입니다.');
    const action=cleanText(req.body?.action);
    if(!['accept','decline','answer','close'].includes(action)) throw new HttpError(400,'지원하지 않는 작업입니다.');
    await purge();
    const {data:request,error:qe}=await supabase.from('mentor_requests').select('*').eq('id',req.params.id).maybeSingle();
    required('요청을 조회하지 못했습니다.',qe);
    if(!request || (request.mentor_id!==person.id && request.requester_id!==person.id))
      throw new HttpError(404,'요청을 찾지 못했습니다.');
    const mentorIsOwner=request.mentor_id===person.id;
    if(['accept','decline','answer'].includes(action)){
      if(!mentorIsOwner || !canOfferMentoring(person)) throw new HttpError(403,'해당 멘토만 처리할 수 있습니다.');
    }
    if(action==='close' && request.requester_id!==person.id) throw new HttpError(403,'신청자만 요청을 철회할 수 있습니다.');
    const now=new Date().toISOString();
    let fields={},expectedStatus=request.status;
    if(action==='accept' || action==='decline') {
      if(request.status!=='pending' || new Date(request.expires_at)<=new Date()) throw new HttpError(409,'이미 처리되었거나 만료된 요청입니다.');
      fields=action==='accept'?{status:'accepted'}:{status:'declined',closed_at:now};
    } else if(action==='answer') {
      const answer=cleanText(req.body?.answer);
      if(request.status!=='accepted'||answer.length<2||answer.length>5000) throw new HttpError(400,'수락된 요청에 2~5000자로 답변해 주세요.');
      fields={status:'answered',answer,answered_at:now,closed_at:now};
    }else{
      if(!['pending','accepted'].includes(request.status)) throw new HttpError(409,'이미 종료된 요청입니다.');
      fields={status:'closed',closed_at:now};
    }
    const {data:updated,error}=await supabase.from('mentor_requests').update(fields).eq('id',request.id)
      .eq('status',expectedStatus).select('id,status').maybeSingle();
    required('요청 처리에 실패했습니다.',error);
    if(!updated) throw new HttpError(409,'다른 작업에서 먼저 처리되었습니다. 새로고침해 주세요.');
    if(action==='answer') await mailUser(request.requester_id,'[SWUFORCE] 멘토링 답변 등록',
      `요청한 멘토링 질문에 답변이 등록되었습니다.\n답변 내용은 홈페이지에 로그인하여 확인해 주세요.\n${config.site}/mentoring`);
    res.json(updated);
  }));
}
