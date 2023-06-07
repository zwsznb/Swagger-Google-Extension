//模拟身份证
function mock_idcard() {
    return Mock.mock(/^[1-8]{2}[0-9]{4}[0-9]{4}((0[1-9]{1})|(1[0-2]{1}))((0[1-9]{1})|(1[0-9]{1})|(2[0-9]{1})|(3[0-1]{1}))[0-9]{3}[0-9xX]{1}$/);
}

function mock_phone() {
    return Mock.mock(/^1[34578]\d{9}$/);
}

function mock_guid() {
    return Mock.mock('@guid()').toString();
}

function mock_date() {
    return Mock.mock('@datetime()');
}

function mock_timestamp() {
    return new Date(mock_date()).getTime();
}

function mock_bool() {
    return Mock.mock({
        "boolean|1-2": true
    }).boolean;
}

function mock_number(min, max) {
    let name = `number|${min}-${max}`;
    return Mock.mock({
        [name]: 100
    }).number;
}

function mock_string(min, max) {
    return Mock.mock(`@word(${min}, ${max})`);
}

function mock_array() {
    return Mock.mock({
        "array|2-5": [
            mock_string(3, 10),
            mock_string(3, 10),
            mock_string(3, 10)
        ]
    }).array;
}

function mock_img_url(text) {
    if (text) {
        return Mock.Random.image('200x100', '#50B347', '#FFF', text);
    }
    return Mock.Random.image('200x100', '#50B347', '#FFF', "test");
}