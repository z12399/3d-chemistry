const clamp=value=>Math.max(0,Math.min(1,value));

/** Only the display clock advances. Molecular geometry is sampled from progress. */
export class LactaseReactionPlayback{
  constructor({duration=30000,onProgress=()=>{},onPlayback=()=>{},isVisible=()=>true,requestFrame=callback=>requestAnimationFrame(callback),cancelFrame=id=>cancelAnimationFrame(id)}={}){
    if(!Number.isFinite(duration)||duration<=0)throw new TypeError('Invalid display duration');
    Object.assign(this,{duration,onProgress,onPlayback,isVisible,requestFrame,cancelFrame});
    this.progress=0;this.speed=1;this.playing=false;this.disposed=false;this.pending=null;this.lastTimestamp=null;
  }
  play(){
    if(this.disposed||this.playing||!this.isVisible())return false;
    if(this.progress>=1)this.seek(0);
    this.playing=true;this.lastTimestamp=null;this.onPlayback(true);this.schedule();return true;
  }
  schedule(){if(this.playing&&!this.disposed&&this.pending===null)this.pending=this.requestFrame(timestamp=>{this.pending=null;this.tick(timestamp);});}
  tick(timestamp){
    if(this.disposed||!this.playing)return;
    if(!this.isVisible()){this.pause();return;}
    if(!Number.isFinite(timestamp)){this.pause();return;}
    if(this.lastTimestamp!==null){
      // A stalled tab never teleports over a chemical beat on its next paint.
      const delta=Math.max(0,Math.min(250,timestamp-this.lastTimestamp));
      this.progress=clamp(this.progress+delta*this.speed/this.duration);this.onProgress(this.progress);
    }
    this.lastTimestamp=timestamp;
    if(this.progress>=1)this.pause();else this.schedule();
  }
  pause(){
    if(this.disposed)return false;
    const wasPlaying=this.playing;this.playing=false;this.lastTimestamp=null;
    if(this.pending!==null){this.cancelFrame(this.pending);this.pending=null;}
    if(wasPlaying)this.onPlayback(false);return wasPlaying;
  }
  seek(value){
    if(this.disposed)return false;if(!Number.isFinite(value))throw new TypeError('Invalid progress');
    this.pause();this.progress=clamp(value);this.onProgress(this.progress);return true;
  }
  setSpeed(value){if(this.disposed)return false;if(![.5,1,2].includes(value))throw new RangeError('Invalid display speed');this.speed=value;this.lastTimestamp=null;return true;}
  dispose(){if(this.disposed)return;this.pause();this.disposed=true;}
}
