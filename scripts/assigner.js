//TODO 根据参数列表模拟数据
//TODO 定义类型映射
//TODO 不同类型值的默认生成
//先只支持处理string和int和double

// { url:/path,params:[{name:name,type:string,in:"query or body"}] }
//数据结构在原来的基础上加上两个属性吧，is_set_value(是否赋值)，value(值)
function auto_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (!params.is_set_value) {
            //integer or number
            if (params.type === "integer" || params.type === "number") {
                params.value = Mock.mock({
                    "number|1-100": 100
                }).number;
            }
            if (params.type === "string") {
                params.value = Mock.mock('@word(5, 10)');
            }
            params.is_set_value = true;
        }
    });
}
//TODO针对时间区间写一个生成器

//时间赋值器,将时间设置为毫秒级的时间戳
function date_time_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        let time = "Time";
        let date = "Date";
        if (params.name.endsWith(time) || params.name.endsWith(date)) {
            //随机时间戳
            let random = new Date(Mock.mock('@datetime()')).getTime();
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
        if (params.name.includes("id")) {
            params.value = Mock.mock('@guid()').toString();
            params.is_set_value = true;
        }
    })
}


//身份证赋值器
function id_card_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name === "idsNo" || params.name === "IdsNo") {
            params.value = Mock.mock(/^[1-8]{2}[0-9]{4}[0-9]{4}((0[1-9]{1})|(1[0-2]{1}))((0[1-9]{1})|(1[0-9]{1})|(2[0-9]{1})|(3[0-1]{1}))[0-9]{3}[0-9xX]{1}$/);
            params.is_set_value = true;
        }
    });
}

//手机号赋值器
function phone_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.includes("phone") || params.name.includes("Phone")) {
            params.value = Mock.mock(/^1[34578]\d{9}$/);
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