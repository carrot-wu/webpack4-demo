const path = require('path'); //定义绝对路径
const fs = require('fs');
const utils = require('./getFileConfig'); //获取文件名称
const htmlWebpackPlugin = require('html-webpack-plugin'); //html模板插件
const copyWebpackPlugin = require('copy-webpack-plugin'); //复制文件  用于一些无法npm的第三方框架ui 但是需要在html模板中添加css框架
const UglifyJSPlugin = require('uglifyjs-webpack-plugin') //开启多线程进行加快速度
const HappyPack = require('happypack') //引入happypack
const os = require('os'); //获取cpu
const happyThreadPool = HappyPack.ThreadPool({size: os.cpus().length});
//css treeShaking
const glob = require('glob')
const PurifyCSSPlugin = require('purifycss-webpack')

const webpack = require('webpack') //获取内置的webpack

const baseConfig = require('./config') //默认第三方类库设置配置

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
		filename: `./page/${pageName}.html`,
		template: path.resolve(__dirname, `../src/page/${pageName}.html`),
		minify: {
			removeComments: true,
			collapseWhitespace: true
		},
		//
		chunks: ['manifest', 'vendor', 'common', pageName],
		chunksSortMode: 'manual' //定义js加载顺序 按顺序
	})
	//template模板
	HTMLPlugins.push(_htmlTemplate)
	//定义入口文件
	entryTemplate[pageName] = path.resolve(__dirname, `../src/js/${pageName}.js`)
})


/*
//  创建多个实例
const extractCSS = new ExtractTextPlugin(' stylesheets / [name] -one.css ');
const extractLESS = new ExtractTextPlugin(' stylesheets / [name] -two.css ');
*/


//单独抽离不会变化的第三方库
const _common = {
	'common': baseConfig.common
}


module.exports = {
	entry: Object.assign(entryTemplate, _common), /*webpack打包的入口文件地址*/
	output: {
		path: path.resolve(__dirname, '../dist'), /*webpack打包的文件输出地址*/
		filename: 'js/[name]-[chunkhash:6].js', //生穿环境用  开发环境必须为hash
		/*webpack打包的文件名字 其中【】那么根据入口文件名字进行命名 其中
		用chunkhash的原因文件没有发生改变并不会修改hash
		*/
		//publicPath 上线替换真实的http,如果设置为/则需把dist下的文件放在项目的根目录


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
					//{loader: 'babel-loader'}, //编译es6
					{loader: 'babel-loader?cacheDirectory=true'}, //编译es6
				],
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},

			{
				test: /\.html$/, //匹配所有css文件
				use: ['html-loader?minimize=true'],
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/i,
				use: [
					{
						loader: 'url-loader',
						options: {
							name: '[name]-[hash:6].[ext]',
							outputPath: 'image/',
							limit: 4000,
							publicPath: '../image' // 所以是基于page文件夹进行相对定位 要设置publicPath绝对路径
						}
					},
					{
						loader: 'image-webpack-loader',
						//压缩图片
						options: {
							pngquant: {
								quality: '65-90',
								speed: 4
							},
						}
					}
				],
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配

			},
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: '[name:6].[ext]',
					outputPath: 'fonts/',
					publicPath: '../fonts' //同理 所以是基于page文件夹进行相对定位 要设置publicPath绝对路径
				},
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配

			}

		]
	},
	/*插件安装*/
	plugins: [
		/*以一个html模板进行创建html文件*/
		...HTMLPlugins,

		new HappyPack({
			id: 'js',
			loaders: ['babel-loader?cacheDirectory=true'],
			threadPool: happyThreadPool,
			// cache: true,
			verbose: true
		}),

		/*
				//提取公用业务的代码 比如多次引用一个base文件
				new webpack.optimize.SplitChunksPlugin({
					chunks: "initial", // 必须三选一： "initial" | "all"(默认就是all) | "async"
					minSize: 0, // 最小尺寸，默认0
					minChunks: 1, // 最小 chunk ，默认1
					maxAsyncRequests: 1, // 最大异步请求数， 默认1
					maxInitialRequests: 1, // 最大初始化请求书，默认1
					name: function () {
					}, // 名称，此选项可接收 function
					cacheGroups: { // 这里开始设置缓存的 chunks
						priority: 0, // 缓存组优先级
						vendor: { // key 为entry中定义的 入口名称
							chunks: "initial", // 必须三选一： "initial" | "all" | "async"(默认就是异步)
							name: "vendor", // 要缓存的 分隔出来的 chunk 名称
							minSize: 0,
							minChunks: 1,
							enforce: true,
							maxAsyncRequests: 1, // 最大异步请求数， 默认1
							maxInitialRequests: 1, // 最大初始化请求书，默认1
							reuseExistingChunk: true // 可设置是否重用该chunk（查看源码没有发现默认值）
						}
					}
				}),
		*/
		new webpack.optimize.SplitChunksPlugin({
			cacheGroups: {
				default: {
					minChunks: 2,
					priority: -20,
					reuseExistingChunk: true,
				},
				//打包重复出现的代码
				vendor: {
					chunks: 'initial',
					minChunks: 2,
					maxInitialRequests: 5, // The default limit is too small to showcase the effect
					minSize: 0, // This is example is too small to create commons chunks
					name: 'vendor'
				},
				//打包第三方类库
				commons: {
					name: "commons",
					chunks: "initial",
					minChunks: Infinity
				}
			}
		}),

		new webpack.optimize.RuntimeChunkPlugin({
			name: "manifest"
		}),

		/*


				new webpack.optimize.CommonsChunkPlugin({
					names: ['vendor'],
					// 好像不给chunks的话默认会报错 好像是bug 必须传入需要提取公共代码的js文件chunk
					chunks: [...templateFileName],
					minChunks: 2, //最低打进公共包的使用次数
				}),

				//提取公用的库 例如jquery啊 react啊什么的 以及 webpack生成的代码manifest
				new webpack.optimize.CommonsChunkPlugin({
					names: ['common', 'manifest'],
					minChunks: Infinity
				}),
		*/


		new webpack.HashedModuleIdsPlugin(),//用于固定模块id 防止调整顺序对于id进行重新打包

		//提升作用域
		new webpack.optimize.ModuleConcatenationPlugin(),

		//压缩代码并且进行没又实用代码的去除 tree shrinking
		new UglifyJSPlugin({
			parallel: true,
		}), //开启多线程进行打包

		//css treeshaking
		new PurifyCSSPlugin({
			// 查找html文件
			paths: glob.sync(path.join(__dirname, '../src/page/*.html'))
		}),

		//复制文件
		new copyWebpackPlugin([
			{
				from: path.resolve(__dirname, '../src/lib/libCss/mui.min.css'),
				to: path.resolve(__dirname, '../dist/lib/libCss'),
				force: true
			}
		]),
		new webpack.BannerPlugin('少年！看你天赋异禀，我这里有五毛钱的武林秘籍——秃头宝典'),


	],

};

