// const swagger_pre_url = "/swagger/v1/swagger.json";
// let swagger_json_path = location.origin + swagger_pre_url;
const local_save_key = "swagger_param";


//TODO 看看有没有其他方案
if (document.readyState !== 'complete') {
    window.addEventListener('load', afterWindowLoaded);
} else {
    afterWindowLoaded();
}

function afterWindowLoaded() {
    //Everything that needs to happen after the window is fully loaded.
    setTimeout(() => {
        let url = document.getElementsByTagName("hgroup")[0].getElementsByTagName("a")[0].href;
        http.get(url, function (err, result) {
            if (err) {
                console.log("swagger json地址请求失败");
            }
            receive_paths(result.paths, result.components.schemas);
        });
    }, 2000)
}


// http.get(swagger_json_path, function (err, result) {
//     if (err) {
//         console.log("swagger json地址请求失败");
//     }
//     receive_paths(result.paths, result.components.schemas);
// });


function receive_paths(paths, object_param) {
    let url_param_map = {};
    for (let url in paths) {
        let url_node = null;
        url_node = handle_param(url, paths, object_param);
        url_param_map[url] = {
            url: url,
            params: url_node
        };
    }
    console.log(url_param_map);
    //保存到本地缓存，或者其它地方,
    //TODO如果保存的大小有限，可以考虑不保存没有输入参数的请求
    save(url_param_map);
}

//保存localStorage
function save(url_param_map) {
    let save_str = JSON.stringify(url_param_map);
    localStorage.setItem(local_save_key, save_str);
}


//把所有的请求参数合并
//统一格式 { url:/path,param:[{name:name,type:string,in:"query or body"}] }
//"parameters": [
// {
//     "name": "key",
//     "in": "query",
//     "schema": {
//       "type": "string"
//     }
//   }
// ],

function handle_param(url, paths, schemas) {
    let method = get_request_method(paths, url);
    let url_node = null;
    if (method === "GET") {
        let get = paths[url].get;
        url_node = handle_request_param(get, schemas);
    }
    if (method === "POST") {
        let post = paths[url].post;
        url_node = handle_request_param(post, schemas);
    }
    return url_node;
}

function handle_request_param(param_source, schemas) {
    let url_param = handle_url_param(param_source);
    let body_param = handle_body_param(param_source, schemas);
    //合并
    return [...url_param, ...body_param];
}
//处理url上的参数
function handle_url_param(param_source) {
    let url_params = [];
    if (!param_source.parameters) {
        return url_params;
    }
    let params = param_source.parameters;
    for (let param in params) {
        //如果是array类型数组，object肯定是不可能在这出现
        let url_param = {
            name: params[param].name,
            in: params[param].in,
            type: params[param].schema.type
        };
        if (params[param].schema.type === "array") {
            url_param.items_type = params[param].schema.items.type;
        }
        //添加必填属性
        if (params[param].required) {
            url_param.required = true;
        }
        if (!url_param.name) {
            continue;
        }
        url_params.push(url_param);
    }
    return url_params;
}
//post的object参数在components-schemas
//如果是单个参数会放到paths-parameter里面，默认url的参数，不考虑
//TODO 文件表单上传，文件表单上传一定是放在body里面的
function handle_body_param(param_source, schemas) {
    if (!param_source.requestBody) {
        return [];
    }
    //TODO 看看要不要改
    //表单上传参数获取
    if (param_source.requestBody.content["multipart/form-data"]) {
        return handle_form_data(param_source.requestBody.content["multipart/form-data"]);
    }
    let body_dto = param_source.requestBody.content["application/json"]["schema"]["$ref"];
    if (!body_dto) {
        return [];
    }
    let temp_arr = body_dto.split("/");
    let dto_name = temp_arr[temp_arr.length - 1];
    let properties = schemas[dto_name].properties;
    let required_arr = schemas[dto_name].required;
    let body_params = [];
    for (let param_name in properties) {
        let body_param = {
            name: param_name,
            in: "body",
            type: properties[param_name].type
        };
        if (properties[param_name].type === "array") {
            body_param.items_type = properties[param_name].items.type;
        }
        //添加必填属性
        if (required_arr) {
            body_param.required = required_arr.includes(param_name);
        }
        //TODO 如果参数类型是object,或者array[object],不过感觉参数不应该这么复杂
        // if (properties[param_name].type === "object") { }
        if (!body_param.name) {
            continue;
        }
        body_params.push(body_param);
    }
    return body_params;
}
//TODO优化整合
function handle_form_data(form_data) {
    let form = [];
    let properties = form_data.schema.properties;
    let required_data = form_data.schema.required;
    for (let i in properties) {
        let form_param = {
            name: i,
            in: "body",
            type: properties[i].type
        };
        //单文件
        if (properties[i].format === "binary") {
            form_param.type = "file";
        }
        //多文件
        if (properties[i].type === "array" && properties[i].items.format === "binary") {
            form_param.items_type = "file";
        }
        //是否必须
        if (required_data && required_data.includes(i)) {
            form_param.required = true;
        }
        form.push(form_param);
    }
    return form;
}

function get_request_method(paths, url) {
    if (paths[url].get) {
        return "GET";
    }
    if (paths[url].post) {
        return "POST";
    }
}



let timer = null

function interval(func, wait) {
    let interv = function () {
        func.call(null);
        timer = setTimeout(interv, wait);
    };
    timer = setTimeout(interv, wait);
}
let map = [];
//定时监听页面变化并添加按钮
interval(() => {
    let list = document.getElementsByClassName("opblock-body");
    if (list) {
        for (let index in list) {
            if (!list[index].parentNode) {
                continue;
            }
            let url_method = list[index].parentNode.parentNode.getElementsByClassName("opblock-summary-path")[0];
            let url = url_method.getAttribute("data-path");
            //插入元素
            //如果不存在该元素才进行插入元素
            let section = list[index].getElementsByClassName("opblock-section-header")[0];
            if (document.getElementById(url)) {
                continue;
            }
            if (is_have_param(url)) {
                if (section) {
                    section.appendChild(create_btn(url));
                }
            }
        }
    }
}, 900);

function get_swagger_param(url) {
    let local_data = localStorage.getItem(local_save_key);
    let format_data = JSON.parse(local_data);
    let data = format_data[url];
    return data;
}

function is_have_param(url) {
    let url_param = get_swagger_param(url);
    if (url_param.params.length > 0) {
        return true;
    }
    return false;
}

function create_btn(url) {
    let div = document.createElement("div");
    div.className = "try-out";
    let btn = document.createElement("button");
    btn.className += "btn try-out__btn";
    btn.textContent = "mock";
    btn.id = url;
    div.appendChild(btn);
    btn.onclick = function () {
        let assgined = call_chain(get_swagger_param(this.id));
        //填充页面数据
        render_data(assgined, this);
    }
    return div;
}

function render_data(assgined_params, btn_ele) {
    let body_params = [];
    let url_params = [];
    let params = assgined_params.params;
    //参数分类
    for (let i in params) {
        if (params[i].in === "body") {
            body_params.push(params[i]);
        }
        if (params[i].in === "query") {
            url_params.push(params[i]);
        }
    }
    if (body_params.length !== 0) {
        //表单文件参数
        if (has_file_param(body_params)) {
            render_form_data(body_params, btn_ele);
            return;
        }
        render_body_data(body_params, btn_ele);
        //是否是包含文件参数
    }
    if (url_params.length !== 0) {
        render_url_data(url_params, btn_ele);
    }
}

//填充body数据
function render_body_data(body_params, btn_ele) {
    //先获取页面上的json，修改数据再赋值回去
    //格式化json
    let textarea = btn_ele.parentNode.parentNode.parentNode.getElementsByTagName("textarea")[0];
    if (!textarea) {
        return;
    }
    let text_json = JSON.parse(btn_ele.parentNode.parentNode.parentNode.getElementsByTagName("textarea")[0].textContent);
    //赋值
    for (let i in body_params) {
        //TODO object 跳过
        if (body_params[i].type === "object") {
            continue;
        }
        let name = body_params[i].name;
        let value = body_params[i].value;
        text_json[name] = value;
    }
    let text_str = JSON.stringify(text_json, null, 4);
    simulation_keyboard(textarea, text_str, "text");
}

function render_form_data(url_params, btn_ele) {
    //data-property-name
    let trs = btn_ele.parentNode.parentNode.parentNode.getElementsByTagName("tr");
    let map = new Map();
    for (let i in url_params) {
        map.set(url_params[i].name, url_params[i]);
    }
    for (let i in trs) {
        if (!trs[i].getAttribute) {
            continue;
        }
        let param_name = trs[i].getAttribute("data-property-name");
        if (param_name) {
            let param = map.get(param_name);
            if (param.type !== "file" && param.type !== "array") {
                simulation_keyboard(trs[i].getElementsByTagName("input")[0], param.value, "input");
                continue;
            }
            //单文件
            if (param.type === "file") {
                render_file_param(param.value, trs[i]);
                continue;
            }
            if (param.type === "array" && param.items_type && param.items_type === "string") {
                render_url_arr_data(trs[i], param.value);
                continue;
            }
            //多文件
            if (param.type === "array" && param.items_type && param.items_type === "file") {
                render_file_params(param.value, trs[i]);
                continue;
            }
        }
    }
}
//https://pqina.nl/blog/set-value-to-file-input/
function render_file_param(url, tr) {
    let input = tr.getElementsByTagName("input")[0];
    getBase64ByImgUrl(url, function (dataURL) {
        //传入base64数据和文件名字
        let file_name = 'imgName-' + (new Date()).getTime();
        let fileFlow = getFileByBase64(dataURL, file_name);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(fileFlow);
        input.files = dataTransfer.files;
        let ev2 = new Event('change', { bubbles: true });
        input.dispatchEvent(ev2);
        // Help Safari out
        // if (input.webkitEntries.length) {
        //     input.dataset.file = `${dataTransfer.files[0].name}`;
        // }
    })
}
//TODO 多文件,看看怎么模拟不同文件吧
function render_file_params(url_arr, tr) {
    getBase64ByImgUrl(url_arr[0], function (dataURL) {

        let btns = tr.getElementsByTagName("button");
        //选择最后一个添加按钮
        let last_btn = btns[btns.length - 1];
        let remove_input = tr.getElementsByClassName("btn btn-sm json-schema-form-item-remove null button");
        //先清掉输入框
        while (remove_input.length > 0) {
            remove_input[0].click();
        }
        //只模拟两个文件
        for (let i = 0; i < 2; i++) {
            //点击按钮添加输入框
            last_btn.click();
            //传入base64数据和文件名字
            let file_name = 'imgName-' + (new Date()).getTime();
            let fileFlow = getFileByBase64(dataURL, file_name);
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(fileFlow);
            let input = tr.getElementsByTagName("input")[i];
            input.files = dataTransfer.files;
            let ev2 = new Event('change', { bubbles: true });
            input.dispatchEvent(ev2);
        }
        // Help Safari out
        // if (input.webkitEntries.length) {
        //     input.dataset.file = `${dataTransfer.files[0].name}`;
        // }
    })
}

function has_file_param(params) {
    let has_file = false;
    for (let i in params) {
        if (params[i].type === "file") {
            has_file = true;
            break;
        }
    }
    return has_file;
}


//填充url数据
function render_url_data(url_params, btn_ele) {
    let tr = btn_ele.parentNode.parentNode.parentNode.getElementsByTagName("tr");
    let params_map = new Map();
    for (let x in url_params) {
        params_map.set(url_params[x].name, url_params[x])
    }
    for (let i in tr) {
        if (tr[i].getAttribute && tr[i].getAttribute("data-param-name")) {
            let param_name = tr[i].getAttribute("data-param-name");
            let param = params_map.get(param_name);
            if (param) {
                if (param.type === "object") {
                    continue;
                }
                let input_type = ""
                if (param.type === "array") {
                    render_url_arr_data(tr[i], param.value);
                } else {
                    let ele = null;
                    if (tr[i].getElementsByTagName("input").length > 0) {
                        input_type = "input";
                        ele = tr[i].getElementsByTagName("input")[0];
                    }
                    if (tr[i].getElementsByTagName("select").length > 0) {
                        input_type = "select";
                        ele = tr[i].getElementsByTagName("select")[0];
                    }
                    simulation_keyboard(ele, param.value, input_type);
                }
            }
        }
    }
}

//渲染url中的array参数
function render_url_arr_data(tr, value) {
    let btns = tr.getElementsByTagName("button");
    //选择最后一个添加按钮
    let last_btn = btns[btns.length - 1];
    let remove_input = tr.getElementsByClassName("btn btn-sm json-schema-form-item-remove null button");
    //先清掉输入框
    while (remove_input.length > 0) {
        remove_input[0].click();
    }
    for (let i = 0; i < value.length; i++) {
        //点击按钮添加输入框
        last_btn.click();
        let input = tr.getElementsByTagName("input")[i];
        simulation_keyboard(input, value[i], "input");
    }
}




//参考：https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-change-or-input-event-in-react-js/46012210#46012210
//yysy这是真nb
function simulation_keyboard(element, value, type) {
    var nativeInputValueSetter = null;
    if (type === "text") {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    }
    if (type === "input") {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    }
    if (type === "select") {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    }
    if (nativeInputValueSetter && element) {
        nativeInputValueSetter.call(element, value);
        var ev2 = null;
        if (type === "select") {
            ev2 = new Event('change', { bubbles: true });
        }
        if (type === "input" || type === "text") {
            ev2 = new Event('input', { bubbles: true });
        }
        element.dispatchEvent(ev2);
    }
}


//图片加载，https://www.cnblogs.com/tandaxia/p/5125275.html
function getBase64ByImgUrl(url, callback) {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';

    img.onload = function () {
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL('image/png');
        callback(dataURL);
        canvas = null;
    };
    img.src = url;
}

//将base64转换为文件流
function getFileByBase64(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}