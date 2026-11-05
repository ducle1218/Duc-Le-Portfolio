"""Build interchangeable, source-locked project blocks in the original Calibri layout."""
import json,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/'tmp/pdf-tools'))
import pymupdf as pdf
OUT=ROOT/'resume/generator/assets'
feed=json.loads((ROOT/'data/portfolio.json').read_text(encoding='utf8'))
source=ROOT/'src/assets/resume/Duc_Le_Resume.pdf'
# Reviewed wording, keyed to source claims in the published portfolio.
COPY={
'box-12': ['Revised the robot chassis from 160 to 225 mm and shortened the upper leg links from 143 to 135 mm to fit the servos.','The team assembled four legs and actuated one; walking control remains in development.'],
'box-7':['The revised CAD replaces a broad rotating wall with 20 radial supports.','Preliminary arm analysis showed about 23 psi at a modeled 0.28 lbf load; this is not a validated operating limit.'],
'box-11':['The preliminary assembly model applies separate -200 lbf Y-direction loads to two aligner plates.','The study examines stress around holes, cutout corners, and spacers; model validation and toleranced drawings are next.'],
'box-3':['Practiced parametric CAD using the official SolidWorks CSWA problem set.','Next steps are to develop selected parts into GD&T drawings and review their manufacturability and assembly.'],
'box-6':['Led chassis and intake design in Onshape.','Built the pneumatic tongue and redesigned sensor mounts to fit tracking hardware within the robot envelope.'],
'box-4':['Led core calculations, trajectory simulation, and structural analysis for a student launch-vehicle concept.','Used MATLAB to develop staging parameters for a target payload of 4,500 lb; the vehicle remained a concept.'],
'box-1':['Contributed CAD and led assembly of the team’s competition robot.','The team revised ground pickup and added a conveyor bracket to stabilize mobile-goal capture.'],
'box-5':['Designed and built an eight-key musical keyboard prototype on an Arduino Uno.','Used a resistor ladder on analog pin A0 to distinguish key presses and map voltage ranges to tones.'],
'box-8':['Handled design and notebook work, rebuilding the AutoCAD model when the original file was unavailable.','The team’s tower held 45 lb before failure, but bending at 67 N left the stated 100 N criterion unmet.'],
'box-9':['Contributed build work and notebook documentation to two sensor-guided robot challenges.','The team robot avoided obstacles and completed the warehouse course in four of five recorded runs.'],
'box-10':['Added twin paper-straw exhaust extensions to a class-built boat to improve straight-line travel.','Used a removable wooden spacer to hold the exhaust spacing and angle while the adhesive set.'],
'box-2':['Produced notebook drawings to document the team’s blade-development process.','The March 16 prototype used three cardboard blades, each 14 inches long and 3 inches wide.']}
TOPICS={
'box-12':['robotics','mechanisms','servo','assembly','3D printing','Onshape'],
'box-7':['rotating machinery','motor','shaft','SolidWorks','3D printing','FEA'],
'box-11':['FEA','finite element analysis','stress analysis','structural analysis','Onshape'],
'box-3':['SolidWorks','parametric','manufacturing','CAD'],
'box-6':['robotics','pneumatics','sensor integration','Onshape','mechanical design'],
'box-4':['aerospace','MATLAB','structures','structural analysis','trajectory','SolidWorks'],
'box-1':['robotics','assembly','AutoCAD','mechanical design'],
'box-5':['Arduino','electronics','circuit','analog','embedded','breadboard'],
'box-8':['civil','structural','structures','load testing','AutoCAD'],
'box-9':['sensors','sonar','navigation','robotics','testing'],
'box-10':['prototyping','fabrication','fixture','jig','testing'],
'box-2':['wind','turbine','energy','aerodynamics','AutoCAD']}
base=pdf.open(source);page=base[0]
page.add_redact_annot(pdf.Rect(48,223,564,573),fill=(1,1,1));page.apply_redactions()
base.save(OUT/'project-base.pdf',garbage=4,deflate=True)
page.get_pixmap(matrix=pdf.Matrix(2,2)).save(OUT/'project-base.png')
font=pdf.Font(fontfile='C:/Windows/Fonts/calibrii.ttf')
def wrap(text,width=488):
 lines=[];line=''
 for word in text.split():
  candidate=(line+' '+word).strip()
  if font.text_length(candidate,fontsize=10)>width:lines.append(line);line=word
  else:line=candidate
 if line:lines.append(line)
 return lines
projects=[]
for p in feed['projects']:
 doc=pdf.open();page=doc.new_page(width=612,height=792)
 page.insert_font(fontname='body',fontfile='C:/Windows/Fonts/calibrii.ttf')
 page.insert_font(fontname='heading',fontfile='C:/Windows/Fonts/calibriz.ttf')
 title={'box-3':'SolidWorks CAD Practice','box-10':'Putt-Putt Boat Redesign','box-1':'High Stakes Robot'}.get(p['id'],p['title'])
 page.insert_text((50.4,234),title,fontname='heading',fontsize=10.5)
 date=p['dateLabel'] if p['dateLabel']!='Date under review' else p['stage']
 page.insert_text((562-font.text_length(date,fontsize=9),234),date,fontname='body',fontsize=9)
 y=248
 for bullet in COPY[p['id']]:
  lines=wrap(bullet);page.insert_text((55,y),'•',fontname='body',fontsize=10)
  for line in lines:page.insert_text((66,y),line,fontname='body',fontsize=10);y+=12
  y+=2
 assert y<=293,(p['id'],y)
 doc.subset_fonts();name='project-'+p['id'];doc.save(OUT/(name+'.pdf'),garbage=4,deflate=True)
 page.get_pixmap(matrix=pdf.Matrix(2,2),clip=pdf.Rect(48,223,564,293)).save(OUT/(name+'.png'))
 projects.append({'id':p['id'],'title':p['title'],'topics':TOPICS[p['id']],'bullets':COPY[p['id']],'file':name+'.pdf','sources':[{k:c[k] for k in ('id','text','owner','state')} for c in p['claims']],'url':feed['siteUrl']+'?project='+p['id']})
(OUT/'projects.json').write_text(json.dumps({'baselineSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'projects':projects},ensure_ascii=False,indent=2),encoding='utf8')
print('Built 12 source-locked project blocks in the original Calibri template.')
