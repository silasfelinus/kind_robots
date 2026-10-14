#!/usr/bin/env python3
"""Compose the Zuzu Showdown hall card: a Street Fighter II style fight screen.

The old card was Zuzu's VS portrait, which read as a character poster rather
than a 2D fighter. This stages a mid-fight frame from the game's own shipped
art (Storm Canyon layers, Zuzu's stand_hp slash, Storm Crow's hit_high), adds a
hit spark and an SF2 HUD (life bars, KO badge, round timer), crops it to the
hall's 4:3 screen and writes public/zuzu-showdown-art/hall-card.webp.

Usage: python3 scripts/zuzu_showdown_hall_card.py [out.webp]
"""
import json,sys,os,math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','public')+'/'
out=sys.argv[1] if len(sys.argv)>1 else R+'zuzu-showdown-art/hall-card.webp'
G=4  # stage px per game px
W,H=480*G,270*G
scene=Image.new('RGBA',(W,H),(0,0,0,255))
st=json.load(open(R+'zuzu-showdown-stages/storm-canyon-hd.json'))
for L in st['layers']:
  im=Image.open(R+'zuzu-showdown-stages/'+L['file']).convert('RGBA').resize((L['w']*G,L['h']*G))
  scene.alpha_composite(im,(L['x']*G,L['y']*G)) if L['x']>=0 else scene.alpha_composite(im.crop((-L['x']*G,0,im.width,im.height)),(0,L['y']*G))
FLOOR=238
def place(fighter,anim,idx,cx,flip=False,shadow=True):
  d=json.load(open(R+'zuzu-showdown-sprites/'+fighter+'-hd.json'))
  atlas=Image.open(R+'zuzu-showdown-sprites/'+d['atlas']).convert('RGBA')
  f=d['animations'][anim]['frames'][idx]; s=G/d['scale']
  t=atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
  ax=f['anchor']['x']; ay=f['anchor']['y']
  if flip: t=t.transpose(Image.FLIP_LEFT_RIGHT); ax=f['w']-ax
  t=t.resize((round(t.width*s),round(t.height*s)),Image.LANCZOS)
  x=round(cx*G-ax*s); y=round(FLOOR*G-ay*s)
  if shadow:
    sh=Image.new('RGBA',(W,H)); dd=ImageDraw.Draw(sh)
    dd.ellipse((cx*G-26*G,FLOOR*G-4*G,cx*G+26*G,FLOOR*G+4*G),fill=(0,0,0,120))
    scene.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
  scene.alpha_composite(t,(x,y))
place('crow','hit_high',1,262,flip=True)
place('zuzu','stand_hp',2,205)
# hit spark
sp=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(sp)
cx,cy=252*G,184*G
pts=[]
for i in range(16):
  r=(15 if i%2==0 else 5)*G; a=i*math.pi/8+0.2
  pts.append((cx+r*math.cos(a),cy+r*math.sin(a)*0.8))
d.polygon(pts,fill=(255,236,120,230))
pts2=[(cx+(p[0]-cx)*0.5,cy+(p[1]-cy)*0.5) for p in pts]
d.polygon(pts2,fill=(255,255,255,255))
scene.alpha_composite(sp.filter(ImageFilter.GaussianBlur(1)))
# crop 4:3 around fight
cw,ch=224*G,168*G; x0=(234-112)*G; y0=(256-168)*G
crop=scene.crop((x0,y0,x0+cw,y0+ch))
# HUD
hud=ImageDraw.Draw(crop)
CW,CH=crop.size
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(CH*0.055))
big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(CH*0.075))
m=int(CW*0.03); bh=int(CH*0.045); top=int(CH*0.05); gap=int(CW*0.07)
barw=CW//2-m-gap
def bar(x,fill_frac,right):
  hud.rectangle((x-4,top-4,x+barw+4,top+bh+4),fill=(20,16,30))
  hud.rectangle((x,top,x+barw,top+bh),fill=(200,30,40))
  fw=int(barw*fill_frac)
  if right: hud.rectangle((x+barw-fw,top,x+barw,top+bh),fill=(255,214,0))
  else: hud.rectangle((x,top,x+fw,top+bh),fill=(255,214,0))
  hud.rectangle((x-4,top-4,x+barw+4,top+bh+4),outline=(255,255,255),width=3)
bar(m,0.82,False); bar(CW-m-barw,0.37,True)
# KO emblem
kx=CW//2; hud.ellipse((kx-gap+6,top-14,kx+gap-6,top+bh+14),fill=(180,20,30),outline=(255,255,255),width=3)
hud.text((kx,top+bh//2),'KO',font=font,anchor='mm',fill=(255,240,200))
def label(x,y,t,anchor):
  hud.text((x,y),t,font=font,anchor=anchor,fill=(255,255,255),stroke_width=4,stroke_fill=(20,16,30))
label(m,top+bh+12,'ZUZU','la'); label(CW-m,top+bh+12,'STORM CROW','ra')
hud.text((kx,top+bh+int(CH*0.06)),'68',font=big,anchor='mt',fill=(255,255,255),stroke_width=5,stroke_fill=(20,16,30))
crop=crop.convert('RGB').resize((960,720),Image.LANCZOS)
crop.save(out,'WEBP',quality=86,method=6)
print(crop.size)
