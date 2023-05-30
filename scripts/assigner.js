//TODO 根据参数列表模拟数据
//TODO 定义类型映射
//TODO 不同类型值的默认生成
//先只支持处理string和int和double

// { url:/path,params:[{name:name,type:string,in:"query or body"}] }
//数据结构在原来的基础上加上两个属性吧，is_set_value(是否赋值)，value(值)
function auto_assigner(url_and_params) {
    for (let i in url_and_params.params) {
        if (!url_and_params.params[i].is_set_value) {
            //integer or number
            if (url_and_params.params[i].type === "integer" || url_and_params.params[i].type === "number") {
                url_and_params.params[i].value = Mock.mock({
                    "number|1-100": 100
                });
            }
            if (url_and_params.params[i].type === "string") {
                url_and_params.params[i].value = Mock.mock({
                    "string|1-8": "abce"
                });
            }
            url_and_params.params[i].is_set_value = true;
        }
    }
}

//时间赋值器,将时间设置为毫秒级的时间戳
//TODO针对时间写一个生成器
function date_time_assigner(url_and_params) {
    let time = "Time";
    let date = "Date";
    for (let i in url_and_params.params) {
        if (url_and_params.params[i].name.endsWith(time) || url_and_params.params[i].name.endsWith(date)) {
            //随机时间戳
            let random = new Date(Mock.mock('@datetime()')).getTime();
            url_and_params.params[i].value = random;
            url_and_params.params[i].is_set_value = true;
        }
    }
}