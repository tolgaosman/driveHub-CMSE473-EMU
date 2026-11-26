import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Polygon, Rectangle

def draw(fname, lanes, ncols, items, flows, title):
    LH=1.55; CW=1.6; X0=0.6
    W=X0+CW*ncols+0.1; H=LH*len(lanes)
    fig,ax=plt.subplots(figsize=(W*0.95,H*0.95+0.3)); ax.set_xlim(-0.02,W+0.02); ax.set_ylim(-0.02,H+0.35); ax.axis('off')
    ax.text(0,H+0.17,title,fontsize=11,fontweight='bold',va='center')
    n=len(lanes)
    for i,l in enumerate(lanes):
        y=LH*(n-1-i)
        ax.add_patch(Rectangle((0,y),W,LH,fc=["#FAFAFA","#F1F5FB"][i%2],ec="#555",lw=1))
        ax.add_patch(Rectangle((0,y),0.5,LH,fc="#E3E8EF",ec="#555",lw=1))
        ax.text(0.25,y+LH/2,l,rotation=90,ha='center',va='center',fontsize=8.5,fontweight='bold')
    N={}
    for k,(kind,c,l,t) in items.items():
        x=X0+CW*c+CW/2; y=LH*(n-1-l)+LH/2
        if kind=='task':
            w,h=1.4,0.74
            ax.add_patch(FancyBboxPatch((x-w/2,y-h/2),w,h,boxstyle="round,pad=0.02,rounding_size=0.12",fc="#EEF3FA",ec="#3B5B85",lw=1.3))
            ax.text(x,y,t,ha='center',va='center',fontsize=8.4); N[k]=(x,y,w/2+0.02,h/2+0.02)
        elif kind in('start','end'):
            r=0.2
            ax.add_patch(Circle((x,y),r,fc="#C8E6C9" if kind=='start' else "#FFCDD2",ec="#2E7D32" if kind=='start' else "#C62828",lw=1.5 if kind=='start' else 3))
            ax.text(x,y-0.38,t,ha='center',va='center',fontsize=7.5); N[k]=(x,y,r,r)
        elif kind=='gw':
            d=0.3
            ax.add_patch(Polygon([(x,y+d),(x+d,y),(x,y-d),(x-d,y)],fc="#FFF9C4",ec="#8D6E00",lw=1.3))
            ax.text(x,y,"X",ha='center',va='center',fontsize=10,fontweight='bold')
            ax.text(x,y+0.47,t,ha='center',va='center',fontsize=7.5); N[k]=(x,y,d,d)
        elif kind=='timer':
            r=0.2
            ax.add_patch(Circle((x,y),r,fc="white",ec="#333",lw=1.2)); ax.add_patch(Circle((x,y),r-0.05,fc="white",ec="#333",lw=0.8))
            ax.plot([x,x],[y,y+0.1],color='#333',lw=1); ax.plot([x,x+0.07],[y,y],color='#333',lw=1)
            ax.text(x,y-0.38,t,ha='center',va='center',fontsize=7.5); N[k]=(x,y,r,r)
    for f in flows:
        a,b=f[0],f[1]; lab=f[2] if len(f)>2 else None; mode=f[3] if len(f)>3 else 'hv'
        xa,ya,wa,ha=N[a]; xb,yb,wb,hb=N[b]
        if abs(ya-yb)<1e-6: pts=[(xa+wa,ya),(xb-wb,yb)] if xb>xa else [(xa-wa,ya),(xb+wb,yb)]
        elif abs(xa-xb)<1e-6: pts=[(xa,ya-ha if yb<ya else ya+ha),(xb,yb+hb if yb<ya else yb-hb)]
        elif mode=='vh': pts=[(xa,ya-ha if yb<ya else ya+ha),(xa,yb),(xb-wb if xb>xa else xb+wb,yb)]
        else: pts=[(xa+wa if xb>xa else xa-wa,ya),(xb,ya),(xb,yb+hb if yb<ya else yb-hb)]
        for p,q in zip(pts[:-2],pts[1:-1]): ax.plot([p[0],q[0]],[p[1],q[1]],color="#444",lw=1.1)
        ax.annotate("",xy=pts[-1],xytext=pts[-2],arrowprops=dict(arrowstyle="-|>",color="#444",lw=1.1,mutation_scale=11,shrinkA=0,shrinkB=0))
        if lab:
            p,q=pts[0],pts[1]
            ax.text((p[0]+q[0])/2+(0.08 if p[0]==q[0] else 0),(p[1]+q[1])/2+(0.06 if p[1]==q[1] else 0),lab,ha='left' if p[0]==q[0] else 'center',va='bottom',fontsize=7.3,style='italic')
    plt.savefig(fname,dpi=170,bbox_inches='tight',facecolor='white'); plt.close()

draw('bpmn_intake.png',["Field Inspector","DriveHub System","Gallery Manager"],10,{
 's':('start',0,0,'Vehicle arrives'),'i1':('task',1,0,'Scan / enter VIN'),'s1':('task',2,1,'Decode VIN\n(cache / registry)'),
 'i2':('task',3,0,'Capture 8 photos\n& checklist'),'i3':('task',4,0,'Upload & submit\ninspection'),'s2':('task',5,1,'AI damage\ndetection (YOLO)'),
 's3':('task',6,1,'Compute\nvaluation'),'i4':('task',7,0,'Confirm / correct\nAI report'),'m1':('task',8,2,'Review report,\naccept / override price'),
 'e1':('end',9,2,'Ready for sale')},
 [('s','i1'),('i1','s1'),('s1','i2'),('i2','i3'),('i3','s2'),('s2','s3'),('s3','i4'),('i4','m1'),('m1','e1')],
 'BPMN 1 — Vehicle intake, inspection and valuation')

draw('bpmn_auction.png',["Gallery Manager","DriveHub System","Dealer / Bidder"],10,{
 's':('start',0,0,'Vehicle ready'),'m1':('task',1,0,'Set start price,\nreserve & times'),'s1':('task',2,1,'Publish auction\n(SCHEDULED)'),
 't':('timer',3,1,'Start time'),'d1':('task',3,2,'Join live room\n(WSS + JWT)'),'d2':('task',4,2,'Place bid'),
 's2':('task',5,1,'Atomic bid check\n& broadcast'),'g1':('gw',6,1,'Reserve met\nat close?'),'s3':('task',7,1,'Record sale,\nhand-over PDF'),
 'd3':('task',8,2,'Receive result\n& invoice'),'m2':('task',7,0,'Relist or\nadjust price'),'e1':('end',9,2,'Sold'),'e2':('end',8,0,'Not sold')},
 [('s','m1'),('m1','s1'),('s1','t'),('t','d1'),('d1','d2'),('d2','s2'),('s2','g1'),('g1','s3','yes'),('s3','d3'),('d3','e1'),('g1','m2','no','vh'),('m2','e2')],
 'BPMN 2 — Live auction process')
