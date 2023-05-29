const swagger_pre_url = "/api/swagger/v1/swagger.json";
const local_save_key = "swagger_param";
let swagger_json_path = location.origin + swagger_pre_url;
http.get(swagger_json_path, function(err, result) {
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
    get_swagger_param();
}

function save(url_param_map) {
    let save_str = JSON.stringify(url_param_map);
    localStorage.setItem(local_save_key, save_str);
}

function get_swagger_param() {
    let a = localStorage.getItem(local_save_key);
    console.log(JSON.parse(a));
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
    let params = {};
    Object.assign(params, url_param, body_param);
    return params;
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
    //TODO url和body双合一请求处理
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