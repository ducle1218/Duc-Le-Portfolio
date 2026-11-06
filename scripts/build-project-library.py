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
'box-12': ['Extended the robot chassis from 160 to 225 mm in CAD to improve mechanism packaging.','Shortened upper leg links from 143 to 135 mm so the legs fit without further lengthening the body.','The prototype has four legs attached and one actuated; walking control remains in development.'],
'box-7':['Redesigned the rotating structure with 20 radial supports in place of a broad wall.','Split the center shaft into printable sections for the Prusa Mini build envelope.','Ran a preliminary arm analysis: about 23 psi at a modeled 0.28 lbf load; load capacity remains unverified.'],
'box-11':['Modeled separate -200 lbf Y-direction loads on two aligner plates in a preliminary assembly study.','Examined stress concentrations around holes, cutout corners, and spacer interfaces.','Next steps: resolve model warnings, check mesh sensitivity, and document critical fits in drawings.'],
'box-3':['Practiced parametric CAD with the official SolidWorks CSWA problem set and reference drawings.','Further work will extend selected parts into GD&T drawings and manufacturing and assembly reviews.'],
'box-6':['Led chassis and intake design in Onshape and developed the pneumatic tongue mechanism.','Redesigned sensor mounts to package tracking hardware within the robot envelope.','The robot scored 60 points in its final skills trial (45 driver, 15 autonomous), above the 50-point target.'],
'box-4':['Led core calculations, trajectory simulations, and structural analysis for a student rocket concept.','Used MATLAB to develop staging parameters for a target satellite payload of 4,500 lb.','Built a bulkhead-sizing spreadsheet to compare calculated stress with material allowable stress.'],
'box-1':['Modeled robot components in CAD and led assembly of the competition robot.','The revised mechanism combines ground pickup with a conveyor bracket to stabilize mobile-goal capture.','The robot’s best recorded score was 12 points in Trial 6 of seven match trials.'],
'box-5':['Designed and built an eight-key musical keyboard prototype on an Arduino Uno.','Used a resistor ladder to distinguish eight key inputs through a single analog pin, A0.','Mapped analog voltage ranges to musical tones in the keyboard’s Arduino program.'],
'box-8':['Developed the tower design and notebook, rebuilding the AutoCAD model when its original file was unavailable.','The tower held 45 lb before failure; bending at 67 N left the 100 N no-bend criterion unmet.','The next design iteration calls for diagonal bracing between layers to address twisting.'],
'box-9':['Built and documented sensor-guided robots for line-following and sonar-guided parking challenges.','The robot avoided obstacles and finished the warehouse course in four of five recorded runs.','After motor-power tuning, the robot completed a clean parallel park on the seventh trial.'],
'box-10':['Independently added twin exhaust extensions to a class-built boat for straighter travel.','Used a removable wooden spacer to hold exhaust spacing and angle while the adhesive set.','Five 33-inch gutter trials averaged about 13.7 s, versus a recorded 33.07 s baseline.'],
'box-2':['Produced engineering notebook drawings documenting blade geometry and design revisions.','The March 16 prototype used three cardboard blades, each 14 inches long and 3 inches wide.','A 20-second wind-tunnel trial tested that prototype facing backward.']}
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
# Preserve the original lower sections as a movable strip. Their typography and
# rules are unchanged; only their vertical position follows the project content.
footer=pdf.open(source)
footer[0].add_redact_annot(pdf.Rect(0,0,612,573),fill=(1,1,1))
footer[0].add_redact_annot(pdf.Rect(0,738,612,792),fill=(1,1,1))
footer[0].apply_redactions()
footer.save(OUT/'project-footer.pdf',garbage=4,deflate=True)
footer[0].get_pixmap(matrix=pdf.Matrix(2,2),clip=pdf.Rect(48,573,564,738)).save(OUT/'project-footer.png')
page.add_redact_annot(pdf.Rect(48,223,564,738),fill=(1,1,1));page.apply_redactions()
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
 # y is the next baseline plus the inter-bullet gap. End just below the final
 # descender, rather than exporting 70 points of padding for every project.
 height=y-223-10
 assert 30<=height<=70,(p['id'],height)
 doc.subset_fonts();name='project-'+p['id'];doc.save(OUT/(name+'.pdf'),garbage=4,deflate=True)
 page.get_pixmap(matrix=pdf.Matrix(2,2),clip=pdf.Rect(48,223,564,223+height)).save(OUT/(name+'.png'))
 projects.append({'id':p['id'],'title':p['title'],'topics':TOPICS[p['id']],'bullets':COPY[p['id']],'height':height,'file':name+'.pdf','sources':[{k:c[k] for k in ('id','text','owner','state')} for c in p['claims']],'url':feed['siteUrl']+'?project='+p['id']})
(OUT/'projects.json').write_text(json.dumps({'baselineSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'projects':projects},ensure_ascii=False,indent=2),encoding='utf8')
print('Built 12 source-locked project blocks in the original Calibri template.')
