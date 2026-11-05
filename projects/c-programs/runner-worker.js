import {WASI,WASIProcExit,File,OpenFile,ConsoleStdout} from './index.js';
class StdinExhausted extends Error {}
class GuardedOpenFile extends OpenFile {
 fd_read(size){const result=super.fd_read(size);if(result.ret===0&&result.data.byteLength===0)throw new StdinExhausted();return result}
}
self.onmessage=async({data})=>{
 try{
  const response=await fetch(`wasm/${encodeURIComponent(data.program)}.wasm`);
  if(!response.ok)throw Error('Could not load the program.');
  const bytes=await response.arrayBuffer();
  const input=new File(new TextEncoder().encode(data.input?data.input+(data.input.endsWith('\\n')?'':'\\n'):''));
  const decoder=new TextDecoder();
  const stream=buffer=>{const text=decoder.decode(buffer,{stream:true});if(text)self.postMessage({type:'output',text})};
  const wasi=new WASI(['program'],[],[new GuardedOpenFile(input),new ConsoleStdout(stream),new ConsoleStdout(stream)]);
  const module=await WebAssembly.compile(bytes);
  const instance=await WebAssembly.instantiate(module,{wasi_snapshot_preview1:wasi.wasiImport});
  try{wasi.start(instance)}catch(error){if(error instanceof StdinExhausted){self.postMessage({type:'done',message:'Stopped safely: the program asked for more input. Add another line and run again.'});return}if(!(error instanceof WASIProcExit))throw error}
  const rest=decoder.decode();if(rest)self.postMessage({type:'output',text:rest});
  self.postMessage({type:'done',message:'Finished.'});
 }catch(error){self.postMessage({type:'done',message:`Could not run program: ${error.message}`})}
};
