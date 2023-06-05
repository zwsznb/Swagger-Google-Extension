//给所有没有赋值的属性进行赋值
function auto_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (!params.is_set_value) {
            //integer or number
            if (params.type === "integer" || params.type === "number") {
                params.value = mock_number(1, 100);
            }
            if (params.type === "string") {
                params.value = mock_string(3, 10);
            }
            if (params.type === "boolean") {
                params.value = mock_bool();
            }
            if (params.type === "array") {
                if (params.items_type === "string") {
                    params.value = mock_array();
                }
                if (params.items_type === "file") {
                    params.value = [mock_img_url()]
                }
            }
            if (params.type === "file") {
                params.value = mock_img_url();
            }
            params.is_set_value = true;
        }
    });
}

//TODO json配置赋值器，优先级最高
function json_assigner(url_and_params) {
    console.log("json 赋值器");
}