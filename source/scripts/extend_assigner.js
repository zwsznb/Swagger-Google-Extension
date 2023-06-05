//先只支持处理string和int和double
// { url:/path,params:[{name:name,type:string,in:"query or body"}] }
//数据结构在原来的基础上加上两个属性吧，is_set_value(是否赋值)，value(值)
//TODO针对时间区间写一个生成器

//时间赋值器,将时间设置为毫秒级的时间戳
function date_time_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        let time = "time";
        let date = "date";
        if (params.name.toLowerCase().endsWith(time) || params.name.toLowerCase().endsWith(date)) {
            //随机时间戳
            let random = mock_timestamp();
            params.value = random;
            params.is_set_value = true;
        }
    });
}

//分页参数赋值器
function page_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.toLowerCase() === "pageIndex".toLowerCase()) {
            params.value = 1;
            params.is_set_value = true;
        }
        if (params.name.toLowerCase() === "pageSize".toLowerCase()) {
            params.value = 10;
            params.is_set_value = true;
        }
    });
}



//id赋值器
function id_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.toLowerCase().includes("id")) {
            params.value = mock_guid();
            params.is_set_value = true;
        }
    })
}


//身份证赋值器
function id_card_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.toLowerCase() === "IdsNo".toLowerCase()) {
            params.value = mock_idcard();
            params.is_set_value = true;
        }
    });
}

//手机号赋值器
function phone_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.toLowerCase().includes("phone")) {
            params.value = mock_phone();
            params.is_set_value = true;
        }
    })
}

function params_cycle(url_and_params, set_value_func) {
    let params = url_and_params.params;
    for (let i in params) {
        set_value_func(params[i]);
    }
}