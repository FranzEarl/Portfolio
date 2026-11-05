const programs = [['calculator','Calculator'],['calendar','Calendar'],['date_calculator','Date calculator'],['digital_clock','Digital clock'],['dino_game','Dino game'],['expense_tracker','Expense tracker'],['hangman','Hangman'],['helloworld','Hello World'],['lights_out','Lights Out'],['number_converter','Number converter'],['online_voting_system','Online voting system'],['pythagorean','Pythagorean calculator'],['rabbit_spawn_tracker','Rabbit spawn tracker'],['randomizer','Randomizer'],['rockpaperscissors','Rock Paper Scissors'],['snakes&ladders_game','Snakes & Ladders'],['text_analyzer','Text analyzer'],['tictactoe','Tic-Tac-Toe'],['trigonometry','Trigonometry']];
const noInputPrograms = new Set(['helloworld','digital_clock','dino_game','rabbit_spawn_tracker']);
const picker=document.querySelector('#c-runner-program');
const input=document.querySelector('#c-runner-input');
const output=document.querySelector('#c-runner-output');
const status=document.querySelector('#c-runner-status');
const stopButton=document.querySelector('#c-runner-stop');
let activeWorker=null;
let timeoutId=null;
for(const [id,name] of programs){const option=document.createElement('option');option.value=id;option.textContent=name;picker.append(option)}
function stopRun(message){if(activeWorker){activeWorker.terminate();activeWorker=null}clearTimeout(timeoutId);stopButton.disabled=true;if(message)status.textContent=message}
document.querySelector('#c-runner-form').addEventListener('submit',event=>{
 event.preventDefault();
 if(!input.value.trim()&&!noInputPrograms.has(picker.value)){status.textContent='Add the program input before running.';input.focus();return}
 if(input.value.length>16000){status.textContent='Input is too long. Keep it under 16,000 characters.';return}
 stopRun();output.textContent='$ '+programs.find(item=>item[0]===picker.value)[1]+'\n';status.textContent='Running…';stopButton.disabled=false;
 const worker=new Worker('c-programs/runner-worker.js',{type:'module'});activeWorker=worker;let text='';
 const timeLimit=picker.value==='digital_clock'?6500:2500;
 worker.onmessage=({data})=>{
  if(data.type==='output'){if(text.length+data.text.length>40000){output.textContent=text+'\n[Output limit reached.]';stopRun('Stopped: output limit reached.');return}text+=data.text;output.textContent='$ '+programs.find(item=>item[0]===picker.value)[1]+'\n'+text}
  else {clearTimeout(timeoutId);activeWorker=null;stopButton.disabled=true;status.textContent=data.message}
 };
 worker.onerror=error=>{stopRun('Program stopped unexpectedly.');output.textContent+='\n'+error.message};
 worker.postMessage({program:picker.value,input:input.value});
 timeoutId=setTimeout(()=>{stopRun('Stopped after the time limit.');},timeLimit);
});
stopButton.addEventListener('click',()=>stopRun('Stopped.'));
document.querySelector('#c-runner-reset').addEventListener('click',()=>{stopRun();input.value='';output.textContent='$ Choose a program and run it.';status.textContent='Ready.'});
document.querySelector('#c-runner-example').addEventListener('click',()=>{picker.value='calculator';input.value='12\n8\n+';status.textContent='Example loaded. Press Run.';input.focus()});
