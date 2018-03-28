const _console = ({ data = "hello", msg = "world", dataObj = { text: "123", txt: "456"} } = {}) => {

    let testObj = Object.assign(dataObj, {noMsg: "hhhhhhh", yesMsg: "nnnnnnn"});
    let {
        text,
        txt,
        noMsg,
        yesMsg
    } = dataObj;


    let currentTem = "";
    currentTem = `大大${data} ${msg} ${text} ${txt} ${yesMsg} ${noMsg}的萨达十大三`;
    return currentTem;
};

function addMasj(dara) {
    console.log(dara + "啊啊啊啊啊啊啊啊啊啊啊啊啊dsadas 啊啊啊啊啊啊啊啊啊");
}
addMasj("大飒飒大师大大打算打伞打算打伞");


const creatElement = ({ele = "div", id = "test", innerHtml = "no msg"} = {}) => {
    const box = document.getElementById("box");
    let dataEle = document.createElement(ele);
    dataEle.innerHtml = innerHtml;
    dataEle.setAttribute("id", id);
    box.innerHtml = dataEle;

};

export {_console, creatElement};
