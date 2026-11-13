(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const COLS = 12, ROWS = 8, TILE = 60;
  const walls = new Set(["2,0","2,1","2,2","4,2","5,2","6,2","8,0","8,1","8,2","8,3","3,4","4,4","5,4","7,5","8,5","9,5","1,6","2,6","3,6"]);
  const crystals = ["1,1","5,0","10,3","6,6"];
  const exit = "10,7";
  const directions = [{name:"ขึ้น",key:"up",dx:0,dy:-1},{name:"ขวา",key:"right",dx:1,dy:0},{name:"ลง",key:"down",dx:0,dy:1},{name:"ซ้าย",key:"left",dx:-1,dy:0}];
  let player, collected, moves, running, timer, visited, plan, manualMode;
  const $ = id => document.getElementById(id);
  const key = (x,y) => x + "," + y;
  const inside = (x,y) => x>=0 && x<COLS && y>=0 && y<ROWS;
  const blocked = (x,y) => !inside(x,y) || walls.has(key(x,y));
  function log(message){const li=document.createElement("li");li.textContent=message;$("log").prepend(li);while($("log").children.length>35)$("log").lastChild.remove();}
  function explain(message){$("decision").textContent=message;}
  function neighbors(x,y){return directions.map(d=>({x:x+d.dx,y:y+d.dy,dir:d})).filter(p=>!blocked(p.x,p.y));}
  function bfs(start, goals){
    const queue=[{x:start.x,y:start.y,path:[]}], seen=new Set([key(start.x,start.y)]);
    while(queue.length){const cur=queue.shift();if(goals.has(key(cur.x,cur.y)))return cur.path;
      for(const n of neighbors(cur.x,cur.y)){const k=key(n.x,n.y);if(seen.has(k))continue;seen.add(k);queue.push({x:n.x,y:n.y,path:[...cur.path,n.dir]});}}
    return [];
  }
  function nextMove(){
    const remaining=crystals.filter(c=>!collected.has(c));
    const targets=new Set(remaining.length?remaining:[exit]);
    const path=bfs(player,targets);
    if(!path.length)return null;
    return path[0];
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const k=key(x,y);ctx.fillStyle=walls.has(k)?"#34445b":"#14263a";ctx.fillRect(x*TILE+1,y*TILE+1,TILE-2,TILE-2);
      if(walls.has(k)){ctx.fillStyle="#50647e";ctx.fillRect(x*TILE+13,y*TILE+13,34,34);}
    }
    for(const c of crystals)if(!collected.has(c)){const [x,y]=c.split(",").map(Number);ctx.fillStyle="#6ce4f4";ctx.beginPath();ctx.moveTo(x*TILE+30,y*TILE+12);ctx.lineTo(x*TILE+46,y*TILE+30);ctx.lineTo(x*TILE+30,y*TILE+48);ctx.lineTo(x*TILE+14,y*TILE+30);ctx.closePath();ctx.fill();}
    {const [x,y]=exit.split(",").map(Number);ctx.fillStyle="#75e0a1";ctx.fillRect(x*TILE+13,y*TILE+10,34,40);ctx.fillStyle="#0b1b27";ctx.fillRect(x*TILE+20,y*TILE+17,20,33);}
    ctx.fillStyle="#f5c96a";ctx.beginPath();ctx.arc(player.x*TILE+30,player.y*TILE+30,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#172335";ctx.beginPath();ctx.arc(player.x*TILE+24,player.y*TILE+26,3,0,Math.PI*2);ctx.arc(player.x*TILE+36,player.y*TILE+26,3,0,Math.PI*2);ctx.fill();
    $("score").textContent=collected.size;$("moves").textContent=moves;
  }
  function stop(){running=false;clearInterval(timer);$("pauseBtn").textContent="เล่นต่อ";$("pauseBtn").disabled=false;$("startBtn").disabled=false;}
  function win(){stop();$("status").textContent="ภารกิจสำเร็จ!";explain("ยอดเยี่ยม! เก็บคริสตัลครบและเดินถึงทางออกแล้ว");log("🏁 AI ทำภารกิจสำเร็จใน "+moves+" ก้าว");}
  function move(dir,source="AI"){
    if(!dir||blocked(player.x+dir.dx,player.y+dir.dy))return false;
    player.x+=dir.dx;player.y+=dir.dy;moves++;
    const k=key(player.x,player.y);
    if(crystals.includes(k)&&!collected.has(k)){collected.add(k);log("💎 เก็บคริสตัลได้แล้ว ("+collected.size+"/4)");}
    visited.add(k);draw();
    if(source==="AI"){explain("ประเมินเส้นทางด้วย BFS: เลือกเดิน"+dir.name+" เพื่อไปยังเป้าหมายที่ใกล้ที่สุด");log("AI เลือกเดิน"+dir.name+" · ตำแหน่ง "+k);}
    else{explain("คุณควบคุมตัวละครเอง · เดิน"+dir.name);log("ผู้เล่นเดิน"+dir.name);}
    if(k===exit&&collected.size===4)win();
    return true;
  }
  function step(){
    if(collected.size===4&&key(player.x,player.y)===exit){win();return;}
    const dir=nextMove();
    if(!dir){stop();$("status").textContent="หาเส้นทางไม่พบ";explain("ไม่พบเส้นทางที่ปลอดภัยในแผนที่นี้");return;}
    move(dir);
  }
  function start(){
    if(running)return;running=true;manualMode=false;$("status").textContent="AI กำลังเล่น";$("startBtn").disabled=true;$("pauseBtn").disabled=false;$("pauseBtn").textContent="พัก";
    const delay=[1100,800,520,300,150][Number($("speed").value)-1];timer=setInterval(step,delay);explain("AI กำลังคำนวณเส้นทางไปยังคริสตัลที่ยังเหลือ");
  }
  function reset(){
    stop();player={x:0,y:0};collected=new Set();moves=0;visited=new Set([key(0,0)]);plan=[];manualMode=false;
    $("status").textContent="พร้อมทำงาน";$("startBtn").disabled=false;$("pauseBtn").disabled=true;$("pauseBtn").textContent="พัก";$("log").innerHTML="";
    $("buildText").textContent="สร้างด่านสำเร็จ";explain("ด่านใหม่พร้อมแล้ว กดเริ่มเพื่อให้ AI วางแผน");log("🧩 สร้างแผนที่ใหม่เรียบร้อย");draw();
  }
  $("startBtn").addEventListener("click",start);
  $("stepBtn").addEventListener("click",()=>{if(running)return;step();});
  $("pauseBtn").addEventListener("click",()=>{if(running){stop();$("status").textContent="พักชั่วคราว";}else start();});
  $("resetBtn").addEventListener("click",reset);
  $("buildBtn").addEventListener("click",()=>{reset();log("✨ AI Builder สร้างด่านสำเร็จ");});
  $("speed").addEventListener("input",e=>{const labels=["ช้า","ค่อนข้างช้า","ปกติ","เร็ว","เร็วมาก"];$("speedLabel").textContent=labels[Number(e.target.value)-1];if(running){stop();start();}});
  document.querySelectorAll("[data-dir]").forEach(btn=>btn.addEventListener("click",()=>{if(running)stop();manualMode=true;$("status").textContent="โหมดควบคุมเอง";move(directions.find(d=>d.key===btn.dataset.dir),"ผู้เล่น");}));
  window.addEventListener("keydown",e=>{const map={ArrowUp:"up",ArrowRight:"right",ArrowDown:"down",ArrowLeft:"left"};if(map[e.key]){e.preventDefault();const b=document.querySelector('[data-dir="'+map[e.key]+'"]');b?.click();}});
  reset();
})();