import {cleanMemory} from './answer-memory.mjs?v=20261115.2';
export function importAnswers(data,current=[]){
 if(data?.format!=='duc-answer-memory-v1')throw new Error('Choose Application-Answers-Backup.json from the helper’s Saved answers → Export backup.');
 const incoming=cleanMemory(data.items),map=new Map(cleanMemory(current).map(a=>[a.id,a]));let added=0;
 for(const item of incoming)if(!map.has(item.id)){map.set(item.id,item);added++;}
 return {items:cleanMemory([...map.values()]),added};
}
