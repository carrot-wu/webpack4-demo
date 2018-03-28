
import "../sass/common.css";

// import '../css/style.less'
require("expose-loader?$!jquery");
import {_console, creatElement} from "../lib/libJs/base.js";

function hello() {
    console.log("hello", "world");
}


hello();
const box = document.getElementById("box");
box.innerHTML = _console({data: "hellos"});

/*
$('#box').on('click', () => {
	$('#box').html('321')
})*/
// console.log(_console({data: 'hellos'}), '231');
creatElement();

if (module.hot) {
    module.hot.accept();
}
