
let canvas;
let context;
let gameLoopTimer: number;
let curPosX = 0;
let curPosY = 0;

const CLICK_NONE = -1, CLICK_RIGHT = 0;
let mouseState = -1;

let hndl: Handler;

let playerName: string="";
let gameState: number=0;
let gameScore: number=0;

const KEY_USE = ['f','c'];
let isKeyDown = {};


const GAME_BREAK = -1;
const GAME_PLAYING=0;
const GAME_OVER=1;

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416; 
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;

const COL_ICON = 1 << 0;


//let socket = new WebSocket('ws://127.0.0.1:5004');
let socket = new WebSocket('ws://49.212.155.232:5004');
let isSocketConnect: boolean = false;



window.onload = function() {
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        Sprite.init();
        hndl = new Handler();

        SceneChage.init();
        SceneChage.toTitle();
        
        document.onmousemove = onMouseMove;   // マウス移動ハンドラ
        document.onmouseup = onMouseUp;       // マウスアップハンドラ
        document.onmousedown = onMouseDown;   // マウスダウンハンドラ

        onKeyInit();
        document.addEventListener("keypress", onKeyDown); //キーボード入力
        document.addEventListener("keyup", onKeyUp);


    }
}




// 接続
socket.addEventListener('open',function(e){
    isSocketConnect=true;
    console.log('Socket connection succeeded');
    scoresWrite()
});

socket.addEventListener('message',function(e){
    let d=e.data+"";
    console.log("received: "+d);
    let dat=d.split(',');

    let s=`<div class="center">[ SCORE RANKING ]<br></div>`;
    const size=15;
    for (let i=0; i<size; i++)
    {
        let n=(i+1)+"";
        s+=`<span class="rankorder">${n.padStart(2, '0')}</span>`;
        s+=`<span class="rankname">${dat[size+i]==""?"ANONYMOUS":dat[size+i]}</span>`;
        s+=`<span class="score-number">${dat[i]}</span><br>`
    }
    let par1 = document.getElementById("scores");
    par1.innerHTML = s;

    let par2 = document.getElementById("plays");
    par2.innerHTML = `このゲームは計 ${dat[size*2]} 回プレイされました`

});


function checkForm($this)
{
    let str: string=$this.value;
    while(str.match(/[^A-Z^a-z\d\-\_]/))
    {
        str=str.replace(/[^A-Z^a-z\d\-\_]/,"");
    }
    $this.value=str.toUpperCase().substr(0, 16);
    playerName = $this.value;
}


function onMouseMove( e ) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    let pos = clientToCanvas( canvas, curPosX, curPosY );
    curPosX = pos.x + window.pageXOffset;
    curPosY = pos.y + window.pageYOffset;
}

function onKeyInit() {
    for (let i=0; i<KEY_USE.length; i++)
    {
        isKeyDown[KEY_USE[i]] = false;
    }
}

function onKeyDown(e) {
    //console.log(e.key);
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = true;
        }
    }
}

function onKeyUp ( e ){
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = false;
        }
    }
}



function onMouseKey( e ) {
    mouseState = -1;
}


function onMouseDown( e ) {
    mouseState = e.button;
}

function onMouseUp( e ) {
    mouseState = -1;
}


function clientToCanvas(canvas, clientX, clientY) {
    let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    let cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    let ret = {
        x: cx,
        y: cy
    };
    return ret;
}




class Handler
{
    back: number = Graph.loadGraph("./images/backDarkGreen--416x240.png");;
    explode: number = Graph.loadGraph("./images/explode--32.png");;
    star: number=Graph.loadGraph("./images/stars--24.png");
    matrixText: number = Graph.loadGraph("./images/matrixText--16x128.png");
    turtle :number = Graph.loadGraph("./images/hornTurtle--32.png");
    atField: number = Graph.loadGraph("./images/atField--4x48.png");
    ball: number = Graph.loadGraph("./images/greenBall--16.png");
    chick: number = Graph.loadGraph("./images/chick--16.png");
    slime: number = Graph.loadGraph("./images/slime--24x24.png");
    tile = Graph.loadGraph("./images/magmaTile--32x32.png");
    bush = Graph.loadGraph("./images/objetBush--48x16.png");
    mush = Graph.loadGraph("./images/mush--16x16.png");
    okCat = Graph.loadGraph("./images/okCat--32x32.png");
    skull = Graph.loadGraph("./images/skull--24x24.png");
    icons = Graph.loadGraph("./images/fastClearIcon--24x32.png");
}



class SceneChage
{
    static init()
    {
        gameLoopTimer = setInterval( function(){},16);
    }
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.set();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.set();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}




//タイトル
class Title
{
    static set()
    {
        new UiTexts();
        BackGround.set();

        new TitleUi();
        gameState = GAME_BREAK;
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();    
        if (mouseState==0 && Useful.between(curPosX,0,SCREEN_WIDTH) && Useful.between(curPosY,0,SCREEN_HEIGHT)) 
        {
            Sprite.allClear(true);
            Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.drawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
    }
    drawing(x,y)
    {

        Useful.drawStringEdged(112*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "LEFT CLICK TO START THE GAME");
    }
}


//ページ内にスコアランキングを表示する
function scoresWrite()
{
    let send: string="";
    send += gameScore.toString()+",";
    send += playerName;
    if (isSocketConnect)socket.send(send);
}




//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=0;

    static set()
    {
        new Player();
        new Cardinal();
        new SlimeGenerator();
        new TerminalPoints();
        Line.set();
        Icons.set();

        new UiTexts();
        BackGround.set();

        gameState = GAME_PLAYING;
        gameScore=0;
        Main.level = 0;
        Main.count=0;
        Main.finishCount=0;

    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GAME_PLAYING:
                {
                    //if (Main.count%12==0) gameScore++;
                    break;
                }
            case GAME_OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        scoresWrite();
                        Sprite.allClear(true);
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }


}




//テンプレ
class Player
{
    static playSpeed;

    mode: number = 0;
    count: number;
    point1X:number;
    point1Y: number;
    point1Sp: number;
    beforeButton=-2;

    constructor()
    {
        let sp = Sprite.set();
        let cls = this;
        Player.playSpeed=1;
        cls.count = 0;
        cls.point1Sp = Sprite.set();
        Sprite.offset(0,0,100);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update);
        Sprite.drawingProcess(sp, cls.drawing);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: Player = Sprite.belong(sp);

        cls.action(cls, sp);

        cls.count++;
    }
    action(cls: Player, sp: number)
    {
        switch (cls.mode)
        {
            case 0:
            {//始点選択
                let cx = curPosX/ROUGH_SCALE, cy = curPosY/ROUGH_SCALE;
                Sprite.image(cls.point1Sp, -1, 0, 0, 16, 16);
                for (let y=0; y<4; y++)
                {
                    let by = Line.baseY[y];
                    if (Useful.between(cy, by-16, by+16) && Useful.between(cx, Line.startX, Line.endX))
                    {
                        Sprite.offset(cls.point1Sp, cx-8, by-16, -100);
                        Sprite.image(cls.point1Sp, hndl.chick, Useful.toInt((cls.count%60)/15)*16, 0, 16, 16);
                        Sprite.blendPal(cls.point1Sp, 128);
                        if (mouseState==CLICK_RIGHT && cls.beforeButton==-1)
                        {
                            Sprite.blendPal(cls.point1Sp, 255)
                            cls.mode = 1;
                            cls.point1X = cx;
                            cls.point1Y = y;
                        }
                    }
                }
                cls.beforeButton = mouseState;
                break;
            }
            case 1:
            {//終点選択
                let cx = curPosX/ROUGH_SCALE, cy = curPosY/ROUGH_SCALE;
                Sprite.image(cls.point1Sp, hndl.chick, Useful.toInt((cls.count%60)/15)*16, 0, 16, 16);
                for (let y=0; y<4; y++)
                {
                    let by = Line.baseY[y];
                    if (Useful.between(cy, by-8, by+8)  && Useful.between(cx, Line.startX, Line.endX))
                    {
                        if (Math.abs(y-cls.point1Y)==1)
                        {//終点確定
                            cls.mode = 0;
                            new BranchLine(cls.point1X, cls.point1Y, cx, y);
                            Sound.playSoundFile("./sounds/obtain.mp3");
                            if (gameState==GAME_PLAYING) gameScore+=1;
                        }
                    }
                }
                break;
            }
        }
    }
    drawing(x0, y0)
    {
        let sp = Sprite.callIndex;
        let cls: Player = Sprite.belong(sp);

        if (cls.mode==1)
        {
            /*
            Graph.drawQuadrangle(
                (cls.point1X-2)*ROUGH_SCALE, Line.baseY[cls.point1Y]*ROUGH_SCALE,
                (cls.point1X+2)*ROUGH_SCALE, Line.baseY[cls.point1Y]*ROUGH_SCALE,
                curPosX+(2)*ROUGH_SCALE, curPosY,
                curPosX+(-2)*ROUGH_SCALE, curPosY,
                "#777", true);
            */
            
            Graph.drawQuadrangle(
                ...Useful.boxToRough([cls.point1X-2, Line.baseY[cls.point1Y], 
                    cls.point1X+2, Line.baseY[cls.point1Y]]),
                curPosX+(2)*ROUGH_SCALE, curPosY,
                curPosX+(-2)*ROUGH_SCALE, curPosY,
                "#777", true);
            }
            


        }

}






//スライム
class Slime
{
    count: number;
    x: number;
    y:number;
    vel: number;
    lineY: number;
    branchMoveTime=0;
    branchMovePoint: [number, number,number,number]=[0,0,0,0];

    constructor(vel)
    {
        let sp = Sprite.set();
        let cls = this;
        cls.count = 0;
        cls.lineY = Useful.rand(4);
        cls.x=-24;
        cls.y=Line.baseY[cls.lineY]-24;
        cls.vel = vel;
        Sprite.offset(sp, 0,0, -200);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: Slime=Sprite.belong(sp);


        if (cls.branchMoveTime>0)
        {//分岐線移動
            let r = (cls.branchMoveTime)/120;

            if (cls.branchMovePoint[0]>cls.branchMovePoint[2]) Sprite.reverse(sp, true);
            cls.x = cls.branchMovePoint[0]*r+cls.branchMovePoint[2]*(1-r);
            cls.y = Line.baseY[cls.branchMovePoint[1]]*r+Line.baseY[cls.branchMovePoint[3]]*(1-r)-24;
            cls.lineY = cls.branchMovePoint[3];
            ///console.log(cls.branchMovePoint);

            cls.branchMoveTime-= cls.vel*Player.playSpeed;
            if (cls.branchMoveTime<=0) {cls.x=cls.branchMovePoint[2]+1;}
        }
        else
        {//通常移動
            let d=12;
            for (let i=0; i<BranchLine.nodes[cls.lineY].length; i++)
            {
                let x1 = BranchLine.nodes[cls.lineY][i][1]-d;
                if (cls.count<Slime.transTime && cls.x<x1 && cls.x+cls.vel*Player.playSpeed>=x1)
                {//分岐線へ移動
                    let id = BranchLine.nodes[cls.lineY][i][0];
                    for (let j=0; j<4; j++) // j=終点のy座標
                    {
                        if (j==cls.lineY) continue;
                        for (let k=0; k<BranchLine.nodes[j].length; k++) // k=終点の可能性のあるy座標上の点
                        {
                            if (BranchLine.nodes[j][k][0]==id)
                            {
                                cls.branchMovePoint[0]=x1;
                                cls.branchMovePoint[1]=cls.lineY;
                                cls.branchMovePoint[2]=BranchLine.nodes[j][k][1]-d;
                                cls.branchMovePoint[3]=j;
                                cls.branchMoveTime = 120;
                            }
                        }
                    }
                    break;
                }
            }
    
            Sprite.reverse(sp, false);
            cls.x+=cls.vel*Player.playSpeed;
    
            if (cls.x>Line.endX)
            {
                if (!TerminalPoints.getIn.okPoint[cls.lineY])
                {//ゲームオーバー
                    Effect.Explosion.diffuse(cls.x-4, cls.y-4, 0);
                    Sprite.clear(sp); 
                    gameState = GAME_OVER;
                    Sound.playSoundFile("./sounds/missed.mp3");
                    return;
                }

                if (gameState==GAME_PLAYING) {
                    Sound.playSoundFile("./sounds/stuck.mp3");
                    gameScore+=100; 
                }
                Slime.goaled++;
                Sprite.clear(sp);return
            }
        }


        Sprite.offset(sp, cls.x, cls.y, -200-cls.y);
        if (cls.count<Slime.transTime-120)
        {
            Sprite.image(sp, hndl.slime, Useful.toInt((cls.count%60)/15)*24, 0, 24, 24);    
        }
        else if (cls.count<Slime.transTime)
        {
            Sprite.image(sp, hndl.slime, Useful.toInt((cls.count%60)/15)*24, (cls.count%12<6) ? 0 : 24, 24, 24);
        }
        else
        {
            Sprite.image(sp, hndl.slime, Useful.toInt((cls.count%60)/15)*24, 24, 24, 24);
        }
        
        cls.count++;
    }

    static transTime=60*45;
    static goaled=0;
}

//スライムジェネレーター
class SlimeGenerator
{
    static getIn: SlimeGenerator;

    count: number;
    stock = 0;
    pushing: number[]=[];
    genetated = 0;

    constructor()
    {
        let sp = Sprite.set();
        let cls = this;
        SlimeGenerator.getIn = this;
        cls.count = 0;
        Slime.goaled=0;
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls:this=Sprite.belong(sp);


        let c=cls.count;
        if (cls.stock>0)
        {
            switch(Main.level)
            {
                case 1:
                    if (c%240==0) cls.pushing.push(0.6); 
                    break;
                case 2:
                    if (c%240==0) cls.pushing.push(0.8); 
                    break;
                case 3:
                    if (c%300==0) cls.pushing.push(1.0, 1.0); 
                    break;
                case 4:
                    if (c%300==0) cls.pushing.push(1.6); 
                    break;
                case 5:
                    if (c%240==0) cls.pushing.push(1.8, 1.8); 
                    break;
                case 6:
                    if (c%180==0) cls.pushing.push(2.0,2.0,2.0); 
                    break;
                case 7:
                    if (c%180==0) cls.pushing.push(2.2,2.2,2.2); 
                    break;
                case 8:
                    if (c%180==0) cls.pushing.push(3,3,3,3); 
                    break;
                }
        }

        if (cls.pushing.length>0 && (cls.count%15)==0)
        {//生成
            let vel = cls.pushing.shift();
            cls.stock--;
            cls.genetated++;
            new Slime(vel);
        }

        cls.count++;
    }
}
















//中心ライン
class Line
{
    count: number;
    id: number;

    constructor(id)
    {
        let sp = Sprite.set();
        let cls = this;
        cls.count = 0;
        cls.id = id;
        Sprite.offset(sp, 0, 0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
        Sprite.drawingProcess(sp, this.drawing);
    }
    update()
    {
    }
    drawing(x0, y0)
    {
        let sp = Sprite.callIndex;
        let cls: Line = Sprite.belong(sp);
        
        {
            let y = Line.baseY[cls.id];
            Graph.drawBox((Line.startX-16)*ROUGH_SCALE, (y-2)*ROUGH_SCALE, 
                (Line.endX+16)*ROUGH_SCALE, (y+2)*ROUGH_SCALE, "#fff", true);
        }
    }

    static baseWidth = 32;
    static baseY = [ROUGH_HEIGHT/2-this.baseWidth-this.baseWidth*2, ROUGH_HEIGHT/2-this.baseWidth, ROUGH_HEIGHT/2+this.baseWidth, ROUGH_HEIGHT/2+this.baseWidth+this.baseWidth*2];
    static startX = 8;
    static endX = ROUGH_WIDTH-64;

    static set()
    {
        for (let y=0; y<4; y++)
        {
            new Line(y);
        }
        
        BranchLine.nodeCurrent=0;
        BranchLine.nodesIndex = 0;
        BranchLine.nodesIndexes=[];
        BranchLine.nodes = [[], [], [], []];
        BranchLine.nodesRemove=[];
        BranchLine.randomSet();
    }
}







//分岐線
class BranchLine
{
    count: number;
    index: number;
    x: number;
    points: [number, number, number, number];

    constructor(x1, y1, x2, y2)
    {
        x1 = Useful.toInt(x1);
        x2 = Useful.toInt(x2);

        let sp = Sprite.set();
        let cls: BranchLine = this;
        
        cls.count = 0;
        cls.points = [x1, y1, x2, y2];
        cls.index = BranchLine.nodesIndex;

        BranchLine.nodesIndexes.push(BranchLine.nodesIndex);
        BranchLine.nodes[y1].push([BranchLine.nodesIndex, x1]);
        BranchLine.nodes[y2].push([BranchLine.nodesIndex, x2]);
        BranchLine.nodes[y1].sort(function(a, b){return a[1]-b[1]});
        BranchLine.nodes[y2].sort(function(a, b){return a[1]-b[1]});
        //console.log(BranchLine.nodes);
        BranchLine.nodesIndex++;
        BranchLine.nodeCurrent++;


        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
        Sprite.drawingProcess(sp, this.drawing);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: BranchLine=Sprite.belong(sp);

        {
            let rem = BranchLine.nodesRemove.indexOf(cls.index); // クリア時の処理
            if (BranchLine.nodeCurrent>=20 || rem>-1)
            {
                if (rem>-1) BranchLine.nodesRemove.splice(rem, 1);

                if (cls.index==BranchLine.nodesIndexes[0] || rem>-1)
                {//消滅
                    for (let i=0; i<4; i++)
                    {
                        for (let j=0; j<BranchLine.nodes[i].length; j++)
                        {
                            if (BranchLine.nodes[i][j][0]==cls.index)
                            {
                                //console.log(j);
                                BranchLine.nodes[i].splice(j,1);
                                break;
                            }
                        }
                    }
                    BranchLine.nodeCurrent--;
                    BranchLine.nodesIndexes.splice(0,1);
                    Sprite.clear(sp);
                    return;
                }
            }
        }
    }
    drawing()
    {
        let sp = Sprite.callIndex;
        let cls: BranchLine = Sprite.belong(sp);
        
        {
            Graph.drawQuadrangle(
                (cls.points[0]-4)*ROUGH_SCALE, Line.baseY[cls.points[1]]*ROUGH_SCALE,
                (cls.points[0]+4)*ROUGH_SCALE, Line.baseY[cls.points[1]]*ROUGH_SCALE,
                (cls.points[2]+4)*ROUGH_SCALE, Line.baseY[cls.points[3]]*ROUGH_SCALE,
                (cls.points[2]-4)*ROUGH_SCALE, Line.baseY[cls.points[3]]*ROUGH_SCALE,
                "#fff", true);
        }
    }



    static randomSet()
    {
        let w = Line.endX-Line.startX - 32;
        for (let i=0; i<4; i++)
        {
            let y=Useful.rand(3);
            let x=Line.startX + i/4*w+ Useful.rand(Useful.toInt(w/4));
            new BranchLine(x, y, x, y+1);
        }
    }

    static nodeCurrent=0;
    static nodesIndex=0;
    static nodesIndexes = [];
    static nodes: Array<Array<[number, number]>>;
    static nodesRemove=[];
}







//終点ポイント
class TerminalPoints
{
    static getIn: TerminalPoints;

    okPoint: [boolean, boolean, boolean, boolean];
    iconSp: [number, number, number, number]=[0,0,0,0];
    count: number;

    constructor()
    {
        let sp = Sprite.set();
        let cls = this;

        TerminalPoints.getIn = cls;

        cls.count = 0;
        cls.pointReset(1);

        for (let i=0; i<4; i++)
        {
            cls.iconSp[i] = Sprite.set();
        }

        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls: TerminalPoints=Sprite.belong(sp);

        for (let i=0; i<4; i++)
        {
            let sp1 = cls.iconSp[i];
            if (cls.okPoint[i])
            {// ok_catの表示
                Sprite.image(sp1, hndl.okCat, Useful.toInt((cls.count%56)/8)*32, 0, 32, 32);
                Sprite.offset(sp1, Line.endX, Line.baseY[i]-18, -50);
            }
            else
            {//どくろの表示
                Sprite.image(sp1, hndl.skull, Useful.toInt((cls.count%60)/15)*24, 0, 24, 24);
                Sprite.offset(sp1, Line.endX, Line.baseY[i]-16, -50);    
            }
            
            
        }

        cls.count++;
    }
    pointReset(ok)
    {
        let cls = TerminalPoints.getIn;
        cls.okPoint = [false, false, false, false];
        for (let i=0; i<ok; i++)
        {
            while(true)
            {
                let r = Useful.rand(4);
                if (!cls.okPoint[r]) 
                {
                    cls.okPoint[r] = true; break;
                }
            }
        }
    }


}




//アイコン
class Icons
{
    static set()
    {
        new this.Fast();
        new this.Clear();
    }

    static Base = class
    {
        sp: number;
        x; y;
        count: number;
        shadeSp: number;
        overSp: number;
        isPush: boolean=false;

        constructor(kind)
        {
            let sp = Sprite.set(hndl.icons, 24*kind,0,24, 32);
            let cls: this = this;
            cls.sp = sp;
            cls.count = 0;

            cls.x = ROUGH_WIDTH-28; cls.y = 4+kind*36;
            Sprite.offset(sp, cls.x, cls.y,-500);
            Sprite.belong(sp, cls);

            cls.shadeSp = Sprite.set(hndl.icons, 48,0,24,32);
            Sprite.blendPal(cls.shadeSp, 200);
            Sprite.offset(cls.shadeSp, cls.x+2, cls.y+2, -500+1);

            cls.overSp = Sprite.set(hndl.icons, 48,0,24,32);
            Sprite.link(cls.overSp, sp);
            Sprite.blendPal(cls.overSp, 0);
            Sprite.offset(cls.overSp, 0,0, -500-1);
        }
        update(pushKey: string)
        {
            let sp=Sprite.callIndex;
            let cls: this = Sprite.belong(sp);

            if (isKeyDown[pushKey]
                || (mouseState==CLICK_RIGHT && Useful.between(curPosX/ROUGH_SCALE, cls.x, cls.x+24) && Useful.between(curPosY/ROUGH_SCALE, cls.y, cls.y+32)))
            {
                Sprite.offset(sp, cls.x+2, cls.y+2);
                Sprite.blendPal(cls.overSp, 50);
                cls.isPush=true;
            }else{
                Sprite.offset(sp, cls.x, cls.y);
                Sprite.blendPal(cls.overSp, 0);
                cls.isPush=false;
            }
            
            cls.count++;
        }
    }


    static Fast=class extends this.Base
    {
        constructor()
        {
            super(0);
            let cls: this = this;
            Sprite.update(cls.sp, cls.update); 
        }
        update()
        {
            super.update('f');
            let sp=Sprite.callIndex;
            let cls: this = Sprite.belong(sp);            

            if (cls.isPush) 
            {
                Player.playSpeed=4;
            }else{
                Player.playSpeed=1;
            }
        }
    }

    static Clear=class extends this.Base
    {
        cooldown=0;
        cooldownMax = 60*60;
        constructor()
        {
            super(1);
            let cls: this = this;
            Sprite.update(cls.sp, cls.update); 
        }
        update()
        {
            super.update('c');

            let sp=Sprite.callIndex;
            let cls: this = Sprite.belong(sp);            

            
            if (cls.isPush && cls.cooldown<=0)
            {
                Sound.playSoundFile("./sounds/clearLine.mp3");
                cls.cooldown=cls.cooldownMax;
                BranchLine.nodesRemove = BranchLine.nodesIndexes.concat(BranchLine.nodesRemove);
                //console.log(BranchLine.nodesRemove);
                BranchLine.randomSet()
                //console.log(BranchLine.nodesRemove);
            }
            else if (cls.cooldown>0) {
                cls.cooldown-=1*Player.playSpeed;
                let h=32-Useful.toInt(32*(cls.cooldown/cls.cooldownMax))
                Sprite.image(sp, hndl.icons, 24, 0, 24, h);
                if (cls.cooldown>0) Sprite.blendPal(sp, 100); else Sprite.blendPal(sp, 255);
            }
            
        }
    }

}







//カーディナル
class Cardinal
{
    count: number;
    

    constructor()
    {
        let sp = Sprite.set();
        let cls = this;
        cls.count = 0;
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls:this=Sprite.belong(sp);

        let c = Slime.goaled;
        let s = SlimeGenerator.getIn;
        if (s.stock<=0 && s.genetated==Slime.goaled)
        {
            switch (Main.level)
            {
                case 0: 
                    TerminalPoints.getIn.pointReset(1);
                    s.stock=3;break;
                case 1: 
                    TerminalPoints.getIn.pointReset(1);
                    s.stock=6;break;
                case 2:
                    TerminalPoints.getIn.pointReset(2); 
                    s.stock=9;break;
                case 3: 
                    TerminalPoints.getIn.pointReset(1);
                    s.stock=12;break;
                case 4:
                    TerminalPoints.getIn.pointReset(2); 
                    s.stock=15;break;
                case 6: 
                    TerminalPoints.getIn.pointReset(1);
                    s.stock=24;break;
                case 7:
                    TerminalPoints.getIn.pointReset(1); 
                    s.stock=1<<31;break;    
            }
            
            if (Main.level>0) Sound.playSoundFile("./sounds/levelUp.mp3");
            Main.level++;
                
        }


        cls.count++;
    }
}







//テンプレ
class Templa
{
    count: number;

    constructor()
    {
        let sp = Sprite.set(-1,0,0,16,16);
        let cls = this;
        cls.count = 0;
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, cls);
        Sprite.update(sp, cls.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
    }
}



class BackGround
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this)
        Sprite.drawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0,0,4096);
    }
    drawing(x0, y0)
    {
        for (let x=0; x<13; x++)
        {
            for (let y=0; y<8; y++)
            {
                Graph.drawGraph(x*96, y*96, 0, 0, 32, 32, hndl.tile, 3);
            }
        }
    }


    static set()
    {
        new BackGround();
        for (let x=-16-8; x<Line.endX; x+=64)
        {
            new Objet.Mush(x, ROUGH_HEIGHT-16);
            new Objet.Bush(x+16, ROUGH_HEIGHT-16);
            }
    }
}


//オブジェ
class Objet
{
    sp: number;
    constructor(x, y)
    {
        let sp = Sprite.set();
        let cls = this;
        cls.sp = sp;
        Sprite.offset(sp, x, y, 200);
        Sprite.belong(sp, cls);
    }

    static Mush = class
    {
        count: number;

        constructor(x, y)
        {
            let sp = Sprite.set();
            let cls = this;
            cls.count = 0;
            Sprite.offset(sp, x, y, 200);
            Sprite.belong(sp, cls);
            Sprite.update(sp, cls.update); 
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);
            Sprite.image(sp, hndl.mush, Useful.toInt((cls.count%120)/30)*16, 0, 16, 16);
            cls.count++;
        }      
    }

    static Bush = class extends Objet 
    {
        constructor(x, y)
        {
            super(x, y);
            Sprite.image(this.sp, hndl.bush, 0, 0, 48, 16);
        }
    }

}





class Effect
{
    static Explosion = class
    {

        x: number;
        y: number;
        count: number;
        type: number;

        constructor(x, y,type)
        {
            this.x=x;
            this.y=y;
            this.count=0;
            this.type=type;

            let sp=Sprite.set(hndl.explode, 0, 0, 32, 32);
            Sprite.offset(sp, x, y, -1000);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);

            let temp=5;
            {
                let c=((cls.count%(temp*6))/temp) | 0;
                Sprite.image(sp,hndl.explode, c*32, cls.type*32, 32, 32);    
            }
            cls.count++;
            if (cls.count>(temp*6*4))
            {
                Sprite.clear(sp);
            }
        }
        static diffuse(x,y,type)
        {
            new Effect.Explosion(x-16,y-16,type);
            new Effect.Explosion(x+16,y-16,type);
            new Effect.Explosion(x-16,y+16,type);
            new Effect.Explosion(x+16,y+16,type);
        }
    }

    static Star=class
    {
        count: number;
        x: number;
        y: number;
        vx: number;
        vy: number;

        constructor(type, x,y,vx,vy)
        {
            this.count = 0;
            this.x=x;
            this.y=y;
            this.vx=vx; 
            this.vy=vy;
            let sp = Sprite.set(hndl.star,type*24,0,24,24);
            Sprite.offset(sp, x,y,-500);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update); 
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);
            
            cls.x+=cls.vx;
            cls.y+=cls.vy;
            cls.vy -= 0.1;
            Sprite.offset(sp, cls.x, cls.y);
            cls.count++;
            if (cls.count>180) {Sprite.clear(sp);return;}
        }
        static set(x, y, type)
        {
            for (let i=-3; i<=3; i++)
            {
                let ang=(-90+i*30)/180*Math.PI;
                let vx=Math.cos(ang)*2;
                let vy=Math.sin(ang)*2;

                new Effect.Star((type==0) ? Math.abs(i%2) : 2,x,y,vx,vy);
            }
        }
    
    }
}










class UiTexts
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.drawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
    }
    drawing(x, y)
    {
        UiTexts.baseText();
        
        if (gameState==GAME_OVER)
        {
            Useful.drawStringEdged(160*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "G A M E  O V E R");
        }
    }
    static baseText()
    {
        Useful.drawStringEdged(...Useful.xyToRough([0,ROUGH_HEIGHT-18]), `Score: ${gameScore}`);
        {
            let t=`Level: ${Main.level}`
            if (Main.level>=8) t="Level: ∞"
            Useful.drawStringEdged(...Useful.xyToRough([360,ROUGH_HEIGHT-18]),t);
        }
    }

}















//お役立ちクラス
class Useful
{
    static drawStringInit()
    {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5"
    }

    static drawStringEdged(x, y, text, inColor="#fff")
    {
        y+=48;
        context.strokeText(text, x, y);
        context.fillStyle = inColor
        context.fillText(text, x, y);

    }

    static rand(n)
    {
        return (Math.random()*n) | 0;
    }
    static rand2(min, max)
    {
        return min+this.rand(max-min);
    }
    static between(n, min, max)
    {
        return (min<=n && n <= max);
    }
    static isString(obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };

    static toInt(n: number): number
    {
        return n|0;
    }

    static xyToRough(arr: [number, number]): [number, number]
    {
        for (let i=0; i<arr.length; i++)
        {
            arr[i]*=ROUGH_SCALE;
        }
        return arr;
    }
    static boxToRough(arr: [number, number, number, number]): [number, number, number, number]
    {
        for (let i=0; i<arr.length; i++)
        {
            arr[i]*=ROUGH_SCALE;
        }
        return arr;
    }


}









class SpriteCompornent
{
    used: boolean = false;
    x: number = 0;
    y: number = 0;
    image: number = -1;
    u: number = 0;
    v: number = 0;
    width: number = 0;
    height: number = 0;
    reverse: boolean = false;
    isProtect: boolean=false;
    mask: number = 0;
    link: number = -1;

    colliderX: number = 0;
    colliderY: number = 0;
    colliderWidth: number = 0;
    colliderHeight: number = 0;

    blendPal: number = 1.0;

    belong: any = undefined;
    
    update: () => void = function(){};
    drawing: (x, y)=>void = Sprite.Drawing.rough;

    constructor()
    {
    }    

}





class Sprite
{
    static SPRITE_MAX: number = 512;
    static sprite: SpriteCompornent[];
    static sprite_Z: Array<Array<number>> = []

    static nextNum: number=0;
    static roughScale: number = 3;

    static callIndex: number;

    static init()
    {
        this.sprite = new Array(this.SPRITE_MAX);
        this.sprite_Z = [];
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            this.sprite[i] = new SpriteCompornent();
            this.sprite_Z.push([i, 0]);
        }

        console.log("Sprite init succeeded");
    }

    static set(imageHndl=-1, u=0, v=0, w=16, h=16): number
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            let sp=(this.nextNum+i) % this.SPRITE_MAX;

            if(this.sprite[sp].used==false)
            {
                this.sprite[sp] = new SpriteCompornent();
                this.sprite_Z[sp][1]=0;
                this.sprite[sp].used=true;
                this.sprite[sp].image = imageHndl;
                this.sprite[sp].u = u;
                this.sprite[sp].v = v;
                this.sprite[sp].width=w;
                this.sprite[sp].height=h;

                this.sprite[sp].colliderWidth=w;
                this.sprite[sp].colliderHeight=h;

                this.nextNum=sp+1;
                return sp;
            }
        }

        return -1;
    }

    static reverse(sp, rev=true): void
    {
        this.sprite[sp].reverse = rev;
    }
    static image(sp, imageHndl=undefined, u=undefined, v=undefined, w=undefined, h=undefined): void
    {
        if (imageHndl!==undefined) this.sprite[sp].image = imageHndl;
        if (u!==undefined) this.sprite[sp].u = u;
        if (v!==undefined) this.sprite[sp].v = v;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
    }

    static offset(sp, x, y, z=undefined): void
    {
        this.sprite[sp].x = x;
        this.sprite[sp].y = y;
        if (z!==undefined) 
        {
            this.sprite_Z[sp][1] = z;
        }
    }
    static screenXY(sp): Array<number>
    {
        let x=this.sprite[sp].x + this.linkDifference_X(sp);
        let y=this.sprite[sp].y + this.linkDifference_Y(sp);
        return [x, y];
    }

    static belong(sp, cls=undefined): any
    {
        if (cls==undefined) return this.sprite[sp].belong;
        this.sprite[sp].belong = cls;
    }

    static link(sp, link): void
    {
        this.sprite[sp].link = link
    }

    static linkDifference_X(sp): number
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].x + this.linkDifference_X(spli);
        }else{
            return 0
        }
    }
    static linkDifference_Y(sp): number
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].y + this.linkDifference_Y(spli);
        }else{
            return 0
        }
    }

    static blendPal(sp: number, pal256: number)
    {
        this.sprite[sp].blendPal=pal256/255;
    }

    static update(sp, func): void
    {
        this.sprite[sp].update = func;
    }
    static drawingProcess(sp,func): void
    {
        this.sprite[sp].drawing = func;
    }

    //クリアしないようにする
    static protect(sp: number, protect: boolean): void
    {
        this.sprite[sp].isProtect = protect;
    }

    static clear(sp: number, protect: boolean = false): void
    {
        if (protect && this.sprite[sp].isProtect) return; 
        this.sprite[sp].used = false;
        this.nextNum = sp+1;
    }

    static allClear(protect: boolean=false)
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (protect && this.sprite[i].isProtect) continue; 
            this.sprite[i].used = false;
        }    
}


    static collider(sp, x=undefined, y=undefined, w=undefined, h=undefined, mask=undefined): void
    {
        if (x!==undefined) this.sprite[sp].x = x;
        if (y!==undefined) this.sprite[sp].y = y;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
        if (mask!==undefined) this.sprite[sp].mask = mask;
    }

    static hitRectangle(x, y, width, height, mask, min=0, max=this.SPRITE_MAX): number
    {
        let x1=x, y1=y, w1=width, h1=height;
        //console.log(min+","+max);
        for(let i=min; i<max; i++)
        {
            if (this.sprite[i].used==true && (this.sprite[i].mask & mask)!=0)
            {
                let x2=this.sprite[i].x + this.linkDifference_X(i) + this.sprite[i].colliderX;
                let y2=this.sprite[i].y + this.linkDifference_Y(i) + this.sprite[i].colliderY;
                let w2=this.sprite[i].width;
                let h2=this.sprite[i].height;

                if ((Math.abs(x2-x1)<w1/2+w2/2)
                    &&
                    (Math.abs(y2-y1)<h1/2+h2/2))
                    {
                        return i;
                    }
            }
        }
    }



    static usedRate(): string
    {
        let c=0;
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (this.sprite[i].used) c+=1;
        }
        return c+" / "+this.SPRITE_MAX;
    }


    static allUpdate(): void
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if(this.sprite[i].used==true) {
                this.callIndex = i;
                this.sprite[i].update();
                //console.log(this.sprite[i]);   
            }
        }
    }

    static allDrawing(): void
    {
        let ol = this.sprite_Z.slice();
        ol.sort(function(a, b){return b[1]-a[1]});
        for (let i in ol)
        {
            let sp = ol[i][0];
            if(this.sprite[sp].used==true)
            {

                let x, y;
                if(this.sprite[sp].link!=-1)
                {
                    x=(this.sprite[sp].x + this.linkDifference_X(sp)) | 0;
                    y=(this.sprite[sp].y + this.linkDifference_Y(sp)) | 0;
                }
                else
                {
                    x=(this.sprite[sp].x) | 0
                    y=(this.sprite[sp].y) | 0
                }
                x *= this.roughScale;
                y *= this.roughScale;
                this.callIndex = sp;
                context.globalAlpha = this.sprite[sp].blendPal;
                this.sprite[sp].drawing(x, y);
            }

        }
    }

    static Drawing = class
    {
        static rough(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, Sprite.roughScale);
        }
        static detail(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, 1);
        }
        static draw(sp, x, y, scale)
        {
            if (Sprite.sprite[sp].image==-1) return;
            let spr=Sprite.sprite[sp];
            if (spr.reverse) 
            {
                Graph.drawTurnGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale); 
            }
            else 
            {
                Graph.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale);
            }
        }
    }


}


//グラフィック読み込み
class Graph
{
    static images={}
    static imageIndex=0;
    //画像読み込み
    static loadGraph(path)
    {
        let handler=this.imageIndex;
        this.images[handler] = new Image;
        this.images[handler].src=path;
        this.imageIndex++;
        return handler;
    }
    //描画
    static drawGraph(x, y, u, v, w, h, handle, scale)
    {
        context.drawImage(this.images[handle], u, v, w, h, x, y, w*scale, h*scale);
    }
    static drawTurnGraph(x, y, u, v, w, h, handle, scale)
    {
        context.save();
        context.translate(x+w*scale,y);
        context.scale(-1, 1);
        context.drawImage(this.images[handle], u, v, w, h, 0, 0, w*scale, h*scale);
        context.restore();
    }
    static drawBox(x1, y1, x2, y2, color: string, fillFlag: boolean)
    {
        x2--; y2--;
        if (fillFlag)
        {
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x1, y2);
            context.lineTo(x2, y2);
            context.lineTo(x2, y1);
            context.closePath();
            context.fill();
        }
        else
        {
            context.strokeStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x1, y2);
            context.lineTo(x2, y2);
            context.lineTo(x2, y1);
            context.closePath();
            context.stroke();
        }
    }

    static drawQuadrangle(x1, y1, x2, y2, x3, y3, x4, y4, color: string, fillFlag: boolean)
    {
        x2--; y2--;
        if (fillFlag)
        {
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.lineTo(x3, y3);
            context.lineTo(x4, y4);
            context.closePath();
            context.fill();
        }
        else
        {
            context.strokeStyle = color;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.lineTo(x3, y3);
            context.lineTo(x4, y4);
            context.closePath();
            context.stroke();
        }
    }
    
}


class Sound
{
    static playSoundFile(path, vol=0.5, loop: boolean=false): HTMLAudioElement
    {
        let music: HTMLAudioElement = new Audio(path);
        music.volume=vol;
        music.loop = false;
        music.play();

        if (loop) 
        {
            music.addEventListener("ended", function () {
                music.currentTime = 0;
                music.play();
              }, false);
        }

        return music;
    }
}












