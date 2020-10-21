"ui";
device.keepScreenOn(3600 * 1000);
device.keepScreenDim(3600 * 1000)

ui.layout(
    <vertical>
        <text id={"text"} textSize="16sp" />
        <list id={"list"}>
            <horizontal w="*">
                <frame w="5"/>
                <horizontal w="auto" gravity="right">
                    <button id="open" text="启动" style="Widget.AppCompat.Button.Colored" textSize="20sp"/>
                </horizontal>
                <vertical w="*">
                    <horizontal id="info1">
                        <text text="{{name}}" textSize="20sp" maxLines="1" textColor="#201fd5"/>
                        <text text="{{tip}}" textStyle="bold|italic" textSize="12sp" textColor="red" ellipsize="end"/>
                    </horizontal>
                    <horizontal id="info2">
                        <text w="auto" text="{{'版本：'+localVersion+' '}}" textSize="10sp" textColor="blue"/>
                        <text w="auto" text="{{desc}}" textSize="10sp" ellipsize="end" maxLines="1"/>
                    </horizontal>
                </vertical>
            </horizontal>
        </list>
    </vertical>
)

var storage = storages.create("caohongchrrg@qq.com:chhub");
var list=storage.get("list");//获取缓存
var exectuion = null
var runCode=function(name,code){
    if(exectuion){
        exectuion.getEngine().forceStop()
    }
    try{
        var appData=storage.get("data_"+name);
        appData.useCount++
        appData.useLast=new Date().getTime()
        storage.put("data_"+name,appData);
    }catch(e){}
    exectuion=engines.execScript(name, code);
};
var uiData=[]
for (var i in list) {
    var item=storage.get("item_"+list[i]);
    var data=storage.get("data_"+list[i]);
    item.tip=""
    item.localVersion=data.currentVersion
    if(data.useCount>=5){
        item.tip="(最常用)"
    }
    if(item.version!=data.currentVersion){
        if(!data.currentVersion){
            item.tip="从未使用过"
        }else{
            item.tip="有新版本("+item.version+")"
        }
    }
    if(item)uiData.push(item)
}
try{
    ui.list.setDataSource(uiData);//设置ui
}catch(e){}

var updateCode=function(item,fn){
    try{
        http.get("https://chrrg.github.io/chhub/"+item.file, {},function(res,err){
            if(err){
                toast("网络异常！");
                return;
            }
            var code;
            if(res.statusCode==200){
                code=res.body.string()
                var appData=storage.get("data_"+item.name);
                appData.currentVersion=item.version
                appData.installTime=new Date().getTime()
                storage.put("data_"+item.name,appData);
                storage.put("code_"+item.file,code);
            }else if(res.statusCode==404){
                toast("脚本暂未上传，稍后再试试吧！");
            }else{
                toast("脚本获取失败，错误码："+res.statusCode);
            }
            fn(code);
        });
    }catch(e){
        toast("更新脚本失败!");
    }
}
function getDateDiff(dateTimeStamp){
    if(!dateTimeStamp)return "从未"
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var halfamonth = day * 15;
    var month = day * 30;
    var now = new Date().getTime();
    var diffValue = now - dateTimeStamp;
    if(diffValue < 0){return "未来";}
    var monthC =diffValue/month;
    var weekC =diffValue/(7*day);
    var dayC =diffValue/day;
    var hourC =diffValue/hour;
    var minC =diffValue/minute;
    var result=""
    if(monthC>=1)
        result+=parseInt(monthC) + "月前";
    else if(weekC>=1)
        result+=parseInt(weekC) + "周前";
    else if(dayC>=1)
        result+=parseInt(dayC) +"天前";
    else if(hourC>=1)
        result+=parseInt(hourC) +"小时前";
    else if(minC>=1)
        result+=parseInt(minC) +"分钟前";
    else result="刚刚";
    return result;
}
ui.list.on("item_bind",function(itemView,itemHolder){
    itemView.info1.on("click",function(){
        var item=itemHolder.item;
        var appData=storage.get("data_"+item.name);
        toast(item.name+"\n使用次数："+appData.useCount+"\n上次使用时间："+getDateDiff(appData.useLast))
    });
    itemView.info2.on("click",function(){
        var item=itemHolder.item;
        var appData=storage.get("data_"+item.name);
        toast("安装时间："+getDateDiff(appData.installTime)+"\n"+item.desc)
    });
    itemView.open.on("click",function(){
        var item=itemHolder.item;
        var appData=storage.get("data_"+item.name);
        var code=storage.get("code_"+item.file);
        if(!appData.currentVersion&&!code){//第一次使用
            confirm("从未使用过此脚本，确认运行此脚本吗？").then(value=>{
                if(!value)return;
                updateCode(item,function(newCode){
                    if(newCode){
                        toast("已开始运行("+item.name+")")
                        runCode(item.name,newCode);
                    }else{
                        toast("下载脚本失败！请检查网络状况！");
                    }
                })
            });
        }else{
            if(item.version!=appData.currentVersion||!code){
                //需要下载最新源码
                toast("更新脚本中("+item.name+")");
                updateCode(item,function(newCode){
                    if(newCode){
                        runCode(item.name,newCode);
                    }else{
                        if(!code){
                            toast("脚本获取失败！请重试！("+item.name+")");
                            return;
                        }
                        toast("更新失败！为您启动旧版脚本("+item.name+")");
                        runCode(item.name,code);
                    }
                })
            }else{
                toast("正在启动最新脚本("+item.name+")")
                runCode(item.name,code);
            }
        }
        
    })
});

//启用按键监听
events.observeKey();
//监听音量下键弹起
events.onKeyDown("volume_down", function(event){
    if(exectuion) {
        toast('已强制结束任务！')
        exectuion.getEngine().forceStop()
        exectuion = null
    } else {
        toast('还没开车呢！')
    }
});
var info = '\n⭕ CHHub 一点仓库\n⭕ 一键完成各种操作\n⭕ 重启可获取最新仓库\n⭕ 运行需要启用无障碍功能\n⭕ 建议设置屏幕常亮时间大于30s\n⭕ 按下音量减可停止运行\n'
ui.text.setText(info)
// threads.start(function() {
//     while(1){
//         while(device.isScreenOn())
//         	sleep(1000)
//         toast('停止运行')
//         if(!exectuion)return;
//         exectuion.getEngine().forceStop()
//         exectuion = null
//     }
// })