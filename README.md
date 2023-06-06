## swagger谷歌插件

> 这个插件主要是用于swagger-ui，使用mock.js快速模拟数据并渲染到页面上，就可省了自己造数据的麻烦
>
> 注：仅用于本地开发测试，所以没有考虑诸如跨域等网络问题

### 简单图解

![1685775931324](/images/1685775931324.jpg)

### 文件目录

![1685848071467](/images/1685848071467.jpg)

> 文件说明
>
> mock.js：主要用于生成模拟数据的js文件，可以从官网直接下载
>
> mock_data.js：mock模拟数据的简单封装
>
> axios.js：网络请求封装函数
>
> extend_assigner.js： 扩展赋值器，用于写自定义赋值器，函数形式编写，都已assigner结尾，方便获取并循环调用，用来给请求的参数进行赋值
>
> internally_assigner.js：内置赋值器，当是默认的赋值器吧，函数形式编写，都已assigner结尾，方便获取并循环调用，用来给请求的参数进行赋值
>
> assigner_register.js：赋值器注册，使用window[assigner_name]的形式获取所有的赋值器，并调用
>
> base.js： 获取swagger的json，并生成新的数据结构保存到localStorage中；同时还会监听页面变化，当点开请求列表进行请求时，生成按钮，可点击用于生成参数

### 页面效果

![1685774603906](/images/1685774603906.jpg)

> 注：这里的mock按钮是根据是否有弹出层的元素来生成的，写了个定时器，效果可能不是特别好，但是还是能用的，不过得先按try it out按钮，如果直接mock，可能会报错，如果存在多种类型的参数

![1685774703164](/images/1685774703164.jpg)

### 赋值器

```javascript
//以assigner形式结尾的函数名编写函数，再由window对象来获取，这部分还是得优化的，比如mock还是封装出来会好点
//id赋值器，自定义
function id_assigner(url_and_params) {
    params_cycle(url_and_params, (params) => {
        if (params.name.toLowerCase().includes("id")) {
            params.value = mock_guid();
            params.is_set_value = true;
        }
    })
}
//默认赋值器
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
            }
            params.is_set_value = true;
        }
    });
}
```

### 存在的问题

> 因为swagger的json文件是需要请求的，json文件的地址其实就在页面上，直接获取就可以了，但是由于谷歌插件的脚本的执行空间是独立的，监听页面的onload事件总是有问题，目前能想到的方案只有两个
>
> 1. 定时器
> 2. 手动改js文件，在base.js中
>
> 这里采取的是定时器，不过还是会偶尔出问题，虽然只要刷新下页面就行了
>
> ![1685776593334](/images/1685776593334.jpg)
>
> 由于本人是后端开发，很多问题可能并未考虑到，也是因为visual studio开发asp.net core会自动弹出swagger界面，和参数过多，所以想到搞个插件

### 注意

> 请求目前只判断了get和post请求，还有表单形式的参数不进行模拟，这个要模拟难度大且没必要，如果参数是对象，且对象里面还有对象的参数不进行模拟，array类型的参数之模拟了元素为字符串类型的

### TODO

- [x] 请求swagger json，并格式化
- [x] mock.js导入，并根据json的接口参数和类型模拟数据
- [x] 时间参数转换为时间戳
- [x] 给array类型写个赋值器
- [x] 整理，将mock数据分离到mock_data.js文件中
- [x] 调整优化考虑，用url作为可以key保存参数数组{url:{ url:/path,params:[{name:name,type:string,in:"query or body"}] }}
- [x] 添加必填项属性
- [x] 分离赋值器，分成一个内部，和一个外部，内部默认，外部可用来扩展
- [x] 文件上传请求
- [ ] 代码很乱，要整理
- [ ] 根据添加的数据过滤，不进行模拟数据，在侧边搞一个输入框，或者利用popup设计一个弹框输入json，利用json来控制模拟数据
- [ ] 手动选择参数的模拟长度等
- [ ] 根据参数列表随机设置值和不设置值
- [ ] 页面设计，比如可编辑数据的模拟配置
- [ ] url和body双合一请求处理(这个不搞了，不科学)
