//以一定的标准进行命名，然后通过window获取并全部调用
let suffix = "assigner"; //赋值器后缀
let auto = "auto_assigner"; //默认的赋值器
let json = "json_assigner"; //json赋值器
let internally_assigner = [auto, json];
let assigner_call_chain = []; //赋值器调用链
//添加json赋值器
assigner_call_chain.push(window[json]);
for (let i in window) {
    let is_func = window[i] && window[i].name;
    //如果是内置的赋值器
    if (is_func && internally_assigner.includes(window[i].name)) {
        continue;
    }
    //添加扩展赋值器
    if (is_func && window[i].name.endsWith(suffix)) {
        assigner_call_chain.push(window[i]);
    }
}
//添加默认赋值器
assigner_call_chain.push(window[auto]);
//赋值器调用
function call_chain(url_and_params) {
    for (let i in assigner_call_chain) {
        assigner_call_chain[i].call(this, url_and_params);
    }
    return url_and_params;
}