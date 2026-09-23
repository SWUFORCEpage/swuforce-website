import React from 'react';

// Text never becomes raw HTML. Imported HTML embeds and unsafe URLs remain literal text.
function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed=new URL(value);
    return parsed.protocol==='https:' && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}
const INLINE= /(!?\[([^\]\n]*)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\n]+)\*)/g;
function inlineMarkdown(value, prefix='p') {
  const parts=[];
  const source=String(value||'');
  let last=0, match, index=0;
  INLINE.lastIndex=0;
  while ((match=INLINE.exec(source))) {
    if (match.index > last) parts.push(source.slice(last,match.index));
    const key=`${prefix}-${index++}`;
    if (match[2]!==undefined) {
      const href=safeUrl(match[3]);
      parts.push(!href ? match[0] : match[0].startsWith('!')
        ? <img key={key} className="article-inline-image" src={href} alt={match[2]} loading="lazy" referrerPolicy="no-referrer"/>
        : <a key={key} href={href} target="_blank" rel="noopener noreferrer">{match[2]}</a>);
    } else if(match[4]!==undefined) parts.push(<strong key={key}>{match[4]}</strong>);
    else if(match[5]!==undefined) parts.push(<code key={key}>{match[5]}</code>);
    else if(match[6]!==undefined) parts.push(<em key={key}>{match[6]}</em>);
    last=INLINE.lastIndex;
  }
  if(last < source.length) parts.push(source.slice(last));
  return parts;
}
function blocks(markdown) {
  const lines=String(markdown||'').replace(/\r\n/g,'\n').split('\n');
  const result=[];let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(!line.trim()){i++;continue;}
    const codeStart=/^```([a-zA-Z0-9+#._-]*)\s*$/.exec(line);
    if(codeStart){let code=[];i++;while(i<lines.length&&!/^```\s*$/.test(lines[i]))code.push(lines[i++]);if(i<lines.length)i++;result.push({kind:'code',text:code.join('\n'),lang:codeStart[1]});continue;}
    const heading=/^(#{1,4})\s+(.+)$/.exec(line);
    if(heading){result.push({kind:'heading',level:heading[1].length,text:heading[2]});i++;continue;}
    const image=/^!\[([^\]\n]*)\]\(([^)\s]+)\)\s*$/.exec(line.trim());
    if(image){result.push({kind:'image',alt:image[1],url:image[2]});i++;continue;}
    if(/^\s*(---+|\*\*\*+)\s*$/.test(line)){result.push({kind:'hr'});i++;continue;}
    if(/^>\s?/.test(line)){let quotes=[];while(i<lines.length&&/^>\s?/.test(lines[i]))quotes.push(lines[i++].replace(/^>\s?/,''));result.push({kind:'quote',lines:quotes});continue;}
    const bullet=/^\s*([-+*]|\d+\.)\s+/.exec(line);
    if(bullet){const ordered=/^\d/.test(bullet[1]);let items=[];const pattern=ordered?/^\s*\d+\.\s+(.+)$/ : /^\s*[-+*]\s+(.+)$/;if(!pattern.test(line)){result.push({kind:'paragraph',lines:[line]});i++;continue;}while(i<lines.length){let next=pattern.exec(lines[i]);if(!next)break;items.push(next[1]);i++;}result.push({kind:ordered?'ol':'ul',items});continue;}
    // Basic Markdown table support for migrated Velog/Tistory Markdown.
    if(line.includes('|') && i+1<lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i+1])){
      const cells=s=>s.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
      const header=cells(line);i+=2;const rows=[];
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim())rows.push(cells(lines[i++]));
      result.push({kind:'table',header,rows});continue;
    }
    let paragraph=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,4}\s+|```|!\[|>\s?|\s*([-+*]|\d+\.)\s+)/.test(lines[i]))paragraph.push(lines[i++]);
    result.push({kind:'paragraph',lines:paragraph});
  }
  return result;
}
export function MarkdownArticle({markdown}) {
  return <div className="article-markdown">{blocks(markdown).map((b,i)=>{
    switch(b.kind){
      case 'heading': return React.createElement(`h${b.level+1}`,{key:i},inlineMarkdown(b.text,`h${i}`));
      case 'image': {const href=safeUrl(b.url);return href?<figure key={i}><img src={href} alt={b.alt||'본문 사진'} loading="lazy" referrerPolicy="no-referrer"/>{b.alt&&<figcaption>{b.alt}</figcaption>}</figure>:<p key={i}>{`![${b.alt}](${b.url})`}</p>;}
      case 'code': return <pre key={i}><code>{b.text}</code></pre>;
      case 'hr':return <hr key={i}/>;
      case 'quote':return <blockquote key={i}>{b.lines.map((x,j)=><React.Fragment key={j}>{inlineMarkdown(x,`q${i}-${j}`)}{j<b.lines.length-1&&<br/>}</React.Fragment>)}</blockquote>;
      case 'ul':case 'ol':{const Tag=b.kind;return <Tag key={i}>{b.items.map((x,j)=><li key={j}>{inlineMarkdown(x,`li${i}-${j}`)}</li>)}</Tag>;}
      case 'table': return <div key={i} className="article-table-scroll"><table><thead><tr>{b.header.map((h,j)=><th key={j}>{inlineMarkdown(h,`th${i}-${j}`)}</th>)}</tr></thead><tbody>{b.rows.map((row,j)=><tr key={j}>{row.map((v,k)=><td key={k}>{inlineMarkdown(v,`td${i}-${j}-${k}`)}</td>)}</tr>)}</tbody></table></div>;
      default:return <p key={i}>{b.lines.map((v,j)=><React.Fragment key={j}>{inlineMarkdown(v,`p${i}-${j}`)}{j<b.lines.length-1&&<br/>}</React.Fragment>)}</p>;
    }
  })}</div>;
}
