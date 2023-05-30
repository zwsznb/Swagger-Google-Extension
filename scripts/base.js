const swagger_pre_url = "/swagger/v1/swagger.json";
const local_save_key = "swagger_param";
let swagger_json_path = location.origin + swagger_pre_url;
http.get(swagger_json_path, function (err, result) {
    if (err) {
        console.log("swagger json地址请求失败");
    }
    receive_paths(result.paths, result.components.schemas);
});


function receive_paths(paths, object_param) {
    let url_param_map = [];
    for (let url in paths) {
        let url_node = null;
        url_node = handle_param(url, paths, object_param);
        url_param_map.push({
            url: url,
            params: url_node
        });
    }
    //保存到本地缓存，或者其它地方,
    //TODO如果保存的大小有限，可以考虑不保存没有输入参数的请求
    save(url_param_map);
}

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
    //TODO 可能会有问题，得留意，没有考虑到对象类型的参数
    // let params = {};
    // Object.assign(params, url_param, body_param);
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
        let url_param = {
            name: params[param].name,
            in: params[param].in,
            type: params[param].schema.type
        };
        if (!url_param.name) {
            continue;
        }
        url_params.push(url_param);
    }
    return url_params;
}
//post的object参数在components-schemas
//如果是单个参数会放到paths-parameter里面，默认url的参数，不考虑
//TODO 没有判断对象的类型，这里默认就是object
function handle_body_param(param_source, schemas) {
    if (!param_source.requestBody) {
        return [];
    }
    //TODO 看看要不要改
    //TODO 文件上传忽略
    if (param_source.requestBody.content["multipart/form-data"]) {
        return [];
    }
    let body_dto = param_source.requestBody.content["application/json"]["schema"]["$ref"];
    if (!body_dto) {
        return [];
    }
    let temp_arr = body_dto.split("/");
    //TODO 忘了怎么改了
    let dto_name = "";
    for (let index in temp_arr) {
        dto_name = temp_arr[index];
    }
    let properties = schemas[dto_name].properties;
    let body_params = [];
    for (let param_name in properties) {
        let body_param = {
            name: param_name,
            in: "body",
            type: properties[param_name].type
        };
        if (!body_param.name) {
            continue;
        }
        body_params.push(body_param);
    }
    return body_params;
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
                section.appendChild(create_btn(url));
            }
        }
    }
}, 900);

function get_swagger_param(url) {
    let local_data = localStorage.getItem(local_save_key);
    let format_data = JSON.parse(local_data);
    let data = null;
    format_data.forEach(element => {
        if (element.url === url) {
            data = element;
        }
    });
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
    for (let i in params) {
        if (params[i].in === "body") {
            body_params.push(params[i]);
        }
        if (params[i].in === "query") {
            url_params.push(params[i]);
        }
    }
    if (body_params.length !== 0) {
        render_body_data(body_params, btn_ele);
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
        //TODO array or obeject 跳过
        if (body_params[i].type === "object" || body_params[i].type === "array") {
            continue;
        }
        let name = body_params[i].name;
        let value = body_params[i].value;
        text_json[name] = value;
    }
    let text_str = JSON.stringify(text_json);
    textarea.value = text_str;
    textarea.innerHTML = text_str;
}
//填充url数据
//TODO优化
function render_url_data(url_params, btn_ele) {
    let inputs = btn_ele.parentNode.parentNode.parentNode.getElementsByTagName("input");
    //placeholder
    for (let i in inputs) {
        for (let x in url_params) {
            if (url_params[x].name === inputs[i].placeholder) {
                if (url_params[x].type === "object" || url_params[x].type === "array") {
                    continue;
                }
                inputs[i].value = url_params[x].value;
            }
        }
    }
}