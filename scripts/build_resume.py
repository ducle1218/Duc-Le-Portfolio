"""Render only the approved Resume tab into a public HTML resume and PDF.

Input is a private JSON file containing Google Drive get_document_text's
structuredContent as `text` and ONLY the Resume entry from get_document as
`links`. No other Notes tab is accepted or written to public output.
"""
from pathlib import Path
import argparse, hashlib, html, json, re
from datetime import datetime, timezone

TAB_ID = 't.v48pjl4upaci'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/assets/resume'

def normalize(source):
    text, links = source['text'], source['links']
    if text.get('tabId') != TAB_ID or links.get('tabId') != TAB_ID or links.get('title') != 'Resume':
        raise ValueError('Refusing to publish a tab other than the approved Resume tab')
    elements = []
    def walk(content):
        for item in content:
            elements.extend(item.get('paragraph', {}).get('elements', []))
            for row in item.get('table', {}).get('tableRows', []):
                for cell in row.get('tableCells', []):
                    walk(cell.get('content', []))
    walk(links.get('body', {}).get('content', []))
    paragraphs = []
    for p in text['paragraphs']:
        value = p['text']
        if not value.strip() or value.strip() == '.':
            continue  # Empty layout cells / standalone punctuation, not resume prose.
        runs, offset = [], 0
        selected = sorted([e for e in elements if p['startIndex'] <= e.get('startIndex', -1) < p['endIndex']], key=lambda e:e['startIndex'])
        cursor = 0
        for e in selected:
            start = e['startIndex'] - p['startIndex'] - offset
            if start > cursor:
                runs.append({'text':value[cursor:start]})
            if e.get('person'):
                person = e['person']['personProperties']
                email = person.get('email')
                runs.append({'text':email or person['name'], **({'url':'mailto:'+email} if email else {})})
                offset += e['endIndex'] - e['startIndex']
                cursor = start
            elif e.get('textRun') is not None:
                end = min(e['endIndex'] - p['startIndex'] - offset, len(value))
                part = value[start:end]
                url = e['textRun'].get('textStyle', {}).get('link', {}).get('url')
                runs.append({'text':part, **({'url':url} if url and re.match(r'^(https?://|mailto:)',url) else {})})
                cursor = end
            else:
                raise ValueError('Unsupported rich element; review before publication')
        if cursor < len(value):
            runs.append({'text':value[cursor:]})
        if not runs:
            runs = [{'text':value}]
        paragraphs.append({'text':''.join(r['text'] for r in runs), 'runs':runs, 'bullet':p.get('isListItem',False)})
    if len(paragraphs) < 8 or 'Duc Le' not in paragraphs[0]['text']:
        raise ValueError('Resume content failed basic integrity checks')
    return paragraphs

def plain(value):
    return re.sub(r'[ \t]+', ' ', value).strip()

def markup(p, pdf=False):
    result = ''
    for r in p['runs']:
        t = html.escape(r['text']).replace('\v','<br/>')
        t = re.sub(r'[ \t]+',' ',t)
        if r.get('url'):
            tag = 'link' if pdf else 'a'
            external = '' if pdf else ' target="_blank" rel="noopener noreferrer"'
            result += f'<{tag} href="{html.escape(r["url"],quote=True)}"{external}>{t}</{tag}>'
        else:
            result += t
    return result.strip()

def rows(paragraphs):
    for i,p in enumerate(paragraphs):
        # Tabs are layout separators in the original Google document.
        for line in p['text'].split('\v'):
            if not line.strip(): continue
            if i == 0: kind='name'
            elif i == 1: kind='contact'
            elif p['bullet']: kind='bullet'
            elif plain(line).isupper(): kind='section'
            elif '\t' in line: kind='split'
            else: kind='body'
            if '\v' in p['text']:
                entry={'text':line,'runs':[{'text':line}],'bullet':p['bullet']}
            else: entry=p
            yield kind,entry

def render_html(paragraphs):
    parts=[]
    for kind,p in rows(paragraphs):
        if kind=='split':
            bits=re.split(r'\s*\t+\s*',p['text'].strip())
            parts.append('<div class="split"><strong>'+html.escape(bits[0])+'</strong><span>'+html.escape(' '.join(bits[1:]))+'</span></div>')
        elif kind=='section': parts.append('<h2>'+markup(p)+'</h2>')
        elif kind=='name': parts.append('<h1>'+markup(p)+'</h1>')
        else: parts.append(f'<p class="{kind}">'+markup(p)+'</p>')
    return '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duc Le — Resume</title><style>
    *{box-sizing:border-box}body{margin:0;background:white;color:#18212f;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55}main{max-width:850px;margin:auto;padding:42px 48px}h1{text-align:center;font-size:32px;letter-spacing:-1px;margin:0 0 6px}h2{font-size:12px;letter-spacing:1.5px;border-bottom:1px solid #ccd3dc;margin:22px 0 9px;padding-bottom:5px}p{margin:5px 0}a{color:inherit;text-decoration:underline;text-underline-offset:2px}.contact{text-align:center;font-size:11px;margin-bottom:14px;color:#485568}.split{display:flex;justify-content:space-between;gap:16px;margin-top:10px}.split span{white-space:nowrap;font-size:11px;color:#485568}.bullet{padding-left:14px;position:relative}.bullet:before{content:'•';position:absolute;left:0;color:#e83765}.body{margin:7px 0}@media(max-width:560px){main{padding:25px 20px}body{font-size:13px}.split{display:block}.split span{display:block;margin:3px 0 5px}h1{font-size:28px}}@media print{main{padding:0}h2,.split{break-after:avoid}.bullet{break-inside:avoid}}
    </style></head><body><main>'''+''.join(parts)+'</main></body></html>'

def render_pdf(paragraphs,path):
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.lib.enums import TA_CENTER,TA_RIGHT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    # Windows fonts are available locally; keep a portable Helvetica fallback.
    font_dir=Path('C:/Windows/Fonts')
    font, bold='Helvetica','Helvetica-Bold'
    if (font_dir/'arial.ttf').exists():
        pdfmetrics.registerFont(TTFont('ResumeSans',str(font_dir/'arial.ttf')))
        pdfmetrics.registerFont(TTFont('ResumeSansBold',str(font_dir/'arialbd.ttf')))
        pdfmetrics.registerFontFamily('ResumeSans',normal='ResumeSans',bold='ResumeSansBold')
        font,bold='ResumeSans','ResumeSansBold'
    ink=HexColor('#18212f')
    base=dict(fontName=font,fontSize=8.7,leading=11,textColor=ink,spaceAfter=3)
    styles={
      'body':ParagraphStyle('body',**base),
      'bullet':ParagraphStyle('bullet',**base,leftIndent=9,firstLineIndent=-7),
      'name':ParagraphStyle('name',fontName=bold,fontSize=23,leading=25,alignment=TA_CENTER,spaceAfter=4,textColor=ink),
      'contact':ParagraphStyle('contact',fontName=font,fontSize=8,leading=10,alignment=TA_CENTER,spaceAfter=7,textColor=ink),
      'section':ParagraphStyle('section',fontName=bold,fontSize=9,leading=11,spaceBefore=9,spaceAfter=5,keepWithNext=True,textColor=ink,borderColor=HexColor('#ccd3dc'),borderWidth=0,borderPadding=0),
      'entry':ParagraphStyle('entry',fontName=bold,fontSize=8.7,leading=11,textColor=ink),
      'date':ParagraphStyle('date',fontName=font,fontSize=8,leading=11,alignment=TA_RIGHT,textColor=ink)
    }
    story=[]
    for kind,p in rows(paragraphs):
        if kind=='split':
            bits=re.split(r'\s*\t+\s*',p['text'].strip())
            t=Table([[Paragraph(html.escape(bits[0]),styles['entry']),Paragraph(html.escape(' '.join(bits[1:])),styles['date'])]],colWidths=[365,163])
            t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
            t.keepWithNext=True
            story.append(t)
        else:
            value=markup(p,pdf=True)
            if kind=='bullet': value='• '+value
            story.append(Paragraph(value,styles[kind]))
    doc=SimpleDocTemplate(str(path),pagesize=(612,792),leftMargin=42,rightMargin=42,topMargin=30,bottomMargin=30,title='Duc Le — Resume',author='Duc Le')
    doc.build(story)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('source',type=Path)
    parser.add_argument('--force',action='store_true',help='Regenerate after renderer changes')
    args=parser.parse_args()
    data=normalize(json.loads(args.source.read_text(encoding='utf-8')))
    serialized=json.dumps(data,ensure_ascii=False,sort_keys=True)
    digest=hashlib.sha256(serialized.encode()).hexdigest()
    manifest_path=OUT/'sync.json'
    if not args.force and manifest_path.exists() and json.loads(manifest_path.read_text())['contentSha256']==digest:
        print('UNCHANGED: Resume content already published.');return
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'resume.html').write_text(render_html(data),encoding='utf-8')
    render_pdf(data,OUT/'Duc_Le_Resume.pdf')
    (OUT/'resume.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    manifest_path.write_text(json.dumps({'contentSha256':digest,'updatedAt':datetime.now(timezone.utc).isoformat(),'paragraphCount':len(data)},indent=2),encoding='utf-8')
    print(f'UPDATED: {len(data)} paragraphs rendered to HTML and PDF. Review PDF before publication.')

if __name__=='__main__':main()
