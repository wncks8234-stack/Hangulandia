import json,re
import os
C=os.path.dirname(os.path.abspath(__file__))+'/'
R=os.path.dirname(os.path.dirname(C.rstrip('/')))+'/'
old=open(C+'Carta.base.html').read().split('\n')
head=open(C+'head_part.html').read().rstrip()
assert head.endswith('</style>'); head=head[:-len('</style>')]
head=head.replace('<title>율미쌤 편지</title>','<title>채팅</title>')
body=open(C+'body.html').read()
logic=open(C+'logic.js').read()
helpers=open(C+'helpers.js').read()
keep=[l for l in old if re.match(r'^(fontApply|thApply|resetOnce)\(',l)]
assert len(keep)==3
D=json.load(open(C+'content.json'))
for k,x in D.items():
  x.pop('quiz',None)
  for tid in [t for t,tp in x['topics'].items() if tp.get('quiz')]: del x['topics'][tid]
  ok=lambda L:[i for i in L if i in x['topics']]
  x['order']=ok(x['order']); x['start']=ok(x['start']); x['fallnext']=ok(x['fallnext'])
  for tid,tp in x['topics'].items():
    nx=[i for i in ok(tp['next']) if i!=tid]
    if not nx:
      o=x['order']; j=o.index(tid); nx=[o[(j+1)%len(o)]]
    tp['next']=nx
  for L in ('start','fallnext'):
    if len(x[L])<3: x[L]+= [i for i in x['order'] if i not in x[L]][:3-len(x[L])]
EX=json.load(open(C+'es_kw.json'))
for k,x in D.items():
  for tid,kws in EX.get(k,{}).items():
    if tid in x['topics']:
      x['topics'][tid]['kw']=[w for w in x['topics'][tid]['kw'] if w.strip() not in ('es','si','en')]+kws
assert '"quiz":true' not in json.dumps(D,separators=(',',':'))
data=json.dumps(D,ensure_ascii=False,separators=(',',':'))
logic=logic.replace('__DATA__',data).replace('__HELPERS__',helpers+'\n'.join(keep))
props=[l for l in old if 'data-dc-script' in l][0]
out=head+'\n'+body.rstrip()+'\n'+props+'\n'+logic.rstrip()+'\n</script>\n</body>\n</html>\n'
open(R+'src/screens/Carta.dc.html','w').write(out)
print(len(out))
