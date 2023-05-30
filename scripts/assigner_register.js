//以一定的标准进行命名，然后通过window获取并全部调用
//TODO 写一个类似可以注册的参数模拟配置链
let suffix = "assigner"; //赋值器后缀
let auto = "auto_assigner"; //默认的赋值器
let assigner_call_chain = []; //赋值器调用链
for (let i in window) {
    if (window[i] && window[i].name && window[i].name.endsWith(suffix) && window[i].name !== auto) {
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