export class Notebook {
 #trials=[];#clips=[];
 get view(){return structuredClone({trials:this.#trials,clips:this.#clips});}
 addTrial(name,change){if(!name.trim()||!change.trim())throw Error('Add a trial name and changed variable.');const t={id:crypto.randomUUID(),name:name.trim(),change:change.trim()};this.#trials.push(t);return t.id;}
 addClip(trialId,source){if(!this.#trials.some(t=>t.id===trialId))throw Error('Select a trial first.');const id=crypto.randomUUID();this.#clips.push({id,trialId,source:{...source},text:'',original:'',version:0,confirmedVersion:null,status:'captured'});return id;}
 #get(id){const c=this.#clips.find(x=>x.id===id);if(!c)throw Error('Clip no longer exists.');return c;}
 proposal(id,text){const c=this.#get(id);if(c.status!=='captured')throw Error('A newer edit exists; transcription was not applied.');c.text=text.trim();c.original=text.trim();c.status=c.text?'draft':'empty';c.version++;}
 edit(id,text){const c=this.#get(id);c.text=text;c.status=text.trim()?'draft':'empty';c.version++;c.confirmedVersion=null;}
 confirm(id,reviewed){const c=this.#get(id);if(!reviewed||!c.text.trim())throw Error('Review the source and nonempty note before confirming.');c.status='confirmed';c.confirmedVersion=c.version;}
 remove(id){const c=this.#get(id);this.#clips=this.#clips.filter(x=>x.id!==id);return c.source.id;}
 reset(){const ids=this.#clips.map(c=>c.source.id);this.#trials=[];this.#clips=[];return ids;}
 compare(){return this.#trials.map(t=>({...t,observations:this.#clips.filter(c=>c.trialId===t.id&&c.status==='confirmed'&&c.version===c.confirmedVersion).map(c=>({captureId:c.id,text:c.text,source:{...c.source},version:c.version}))}));}
}
