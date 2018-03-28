const path = require('path'); //定义绝对路径
const fs = require('fs');
const utils = require('./build/getFileConfig'); //获取文件名称
const htmlWebpackPlugin = require('html-webpack-plugin'); //html模板插件
const cleanWebpackPlugin = require('clean-webpack-plugin'); //每次清楚dist文件的插件
const ExtractTextPlugin = require('extract-text-webpack-plugin');//加载分离css文件和js文件的插件
const webpack = require('webpack') //获取内置的webpack
//TODO 一些优化 比如html文件可以放入page文件夹以内 但是还没弄或者配置开发环境和打包环境

/*一些多页面应用的配置*/


// 定义入口文件的集合
let entryTemplate = {}
// 通过 html-webpack-plugin 生成的 HTML 集合
let HTMLPlugins = [];

/*文件名字数组*/
let templateFileName = utils.getFileNameList('./src/page')


// 通过htmlwebpackPlugin创建多个模板文件

templateFileName.forEach((pageName) => {
	const _htmlTemplate = new htmlWebpackPlugin({

		/* 删除了 这里加了page目录本来想着页面能够丢到page目录下  后面发现热更新模块并不行 反而资源文件能够读取了*/
		filename: `${pageName}.html`,
		template: path.resolve(__dirname, `./src/page/${pageName}.html`),
		minify: {
			removeComments: true,
			collapseWhitespace: true
		},
		//TODO 定义每个文件所加载的js模块 自身带的js 以及commonsjs
		chunks: ['vendor', pageName, 'app']
	})
	//template模板
	HTMLPlugins.push(_htmlTemplate)
	//定义入口文件
	entryTemplate[pageName] = path.resolve(__dirname, `./src/js/${pageName}.js`)
})


/*
//  创建多个实例
const extractCSS = new ExtractTextPlugin(' stylesheets / [name] -one.css ');
const extractLESS = new ExtractTextPlugin(' stylesheets / [name] -two.css ');
*/


const isBuild = process.env.NODE_ENV === 'production' //判断是否是生产环境
const cssDev = [
	{loader: 'style-loader'}, //加载loader
	{loader: 'css-loader', options: {importLoaders: 1}},
	{loader: 'postcss-loader'},

] //开发环境下css的配置

//生产环境css配置
const cssProd = ExtractTextPlugin.extract({
	fallback: 'style-loader',

	use: [
		{loader: 'css-loader', options: {importLoaders: 1}},
		{loader: 'postcss-loader'},
	],
	publicPath: '../'    //TODO 因为这里下面的css文件输出地址在css中  路径图片的../变成了 /被吃掉了 搜一下雨要在这充值设置一下
})

const cssConfig = isBuild ? cssProd : cssProd; //判断是什么环境


module.exports = {
	entry: Object.assign(entryTemplate, {'app': path.resolve(__dirname, `./src/js/app.js`)}), /*webpack打包的入口文件地址*/
	output: {
		path: path.resolve(__dirname, './dist'), /*webpack打包的文件输出地址*/
		filename: 'js/[name]-[hash:6].js', /*webpack打包的文件名字 其中【】那么根据入口文件名字进行命名 其中哈有hash:6*/
		//publicPath 上线替换真实的http,如果设置为/则需把dist下的文件放在项目的根目录
		//publicPath:'/'  //环境
		//publicPath: './'
		//publicPath: './'

	},

	/*loader 模块加载*/
	module: {
		rules: [
			/*引入jq  如果在项目中需要用到jquery 直接require("expose-loader?$!jquery");*/
			{
				test: require.resolve('jquery'),
				use: [{
					loader: 'expose-loader',
					options: 'jQuery'
				}, {
					loader: 'expose-loader',
					options: '$'
				}]
			},
			{
				test: /\.js$/, //匹配所有css文件
				use: [
					{loader: 'babel-loader'}, //编译es6
				],
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},
			{
				test: /\.css$/, //匹配所有css文件
				use: cssConfig,
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},
			{
				test: /\.html$/, //匹配所有css文件
				use: ['html-loader?minimize=true'],
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/i,
				use: [{
					loader: 'url-loader',
					options: {
						name: '[name]-[hash:6].[ext]',
						outputPath: 'image/',
						limit: 4000,
						//publicPath:'/' //因为实在css中加载的 所以是基于css文件夹进行相对定位 要设置publicPath绝对路径
					}

				}, 'image-webpack-loader']
			},
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: '[name:6].[ext]',
					outputPath: 'fonts/'
				}
			}
			/*, 两种不同文文件的打包方法
			{
				test:/\.less$/, //匹配所有less文件
				use:extractLESS.extract([
					//{loader:'style-loader'}, //加载loader
					{loader:'css-loader',options:{importLoaders:1}},
					{loader:'postcss-loader'},
					{loader:'less-loader'}//因为上面编译的css所有要吧less先编译成css

				]),
				exclude:/node_modules/ //excluder排除怼node下的文件的匹配
			}*/

		]
	},
	/*插件安装*/
	plugins: [
		/*以一个html模板进行创建html文件*/
		...HTMLPlugins,
		/*每次进行打包的时候都把dist文件的内容进行清除*/
		new cleanWebpackPlugin(
			['dist'], //这里指每次清除dist文件夹的文件 匹配的文件夹
			{
				root: __dirname,//制定插件根目录位置
				//verbose: true, //开启控制台输出
				dry: false//启用删除文件
			}
		),
		/*加载把css文件单独分离出来的插件*/
		new ExtractTextPlugin({
			filename: (getPath) => {
				return getPath('css/[name]-[contenthash:6].css').replace('css/js', 'css');
				/* [name] 根据html名字获取的css名字  contenthash:6加上hash:6值*/
			},
			allChunks: true
		}),
		/*  开启热模块更新*/
		//new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.optimize.CommonsChunkPlugin({
			name: "vendor",
			// filename: "vendor.js"
			// (Give the chunk a different name)

			minChunks: Infinity,
			// (with more entries, this ensures that no other module
			//  goes into the vendor chunk)
		})

	],
	/*开启sourcemap调试*/
	//devtool: 'eval-source-map',
	devServer: {
		//contentBase: path.join(__dirname, "./dist"),
		//因为热更新使用的是内存 默认资源是保存在内存中的 需要使用publishpath制定相对路径
		contentBase: './',
		publicPath: '/',
		port: 8032,
		hot: true, //热更新
		hotOnly: true,
		/*inline模式开启服务器*/
		inline: true,
		//historyApiFallback: true, //跳转页面
		openPage: './index.html', //默认打开的页面
		open: true, //自动打开页面,
		clientLogLevel: "none" //阻止打印那种搞乱七八糟的控制台信息
		//注意  热更新还存在着许多的bug
	}
};