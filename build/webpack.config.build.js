// 引入基础配置
const path = require('path'); //定义绝对路径
const webpackBase = require("./webpack.config.base");
const ExtractTextPlugin = require('extract-text-webpack-plugin');//加载分离css文件和js文件的插件
const webpackMerge = require('webpack-merge')
const cleanWebpackPlugin = require('clean-webpack-plugin'); //每次清楚dist文件的插件

const HappyPack = require('happypack') //引入happypack
const os = require('os'); //获取cpu
const happyThreadPool = HappyPack.ThreadPool({size: os.cpus().length});

/*
//css treeShaking
const glob = require('glob')
const PurifyCSSPlugin = require('purifycss-webpack')
*/

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


//生产环境css配置
const cssProd = ExtractTextPlugin.extract({
	fallback: 'style-loader',

	use: 'happypack/loader?id=css',
	publicPath: '../'    //TODO 因为这里下面的css文件输出地址在css中  路径图片的../变成了 /被吃掉了 搜一下雨要在这充值设置一下
})


module.exports = webpackMerge(webpackBase, {
	mode: "production",
	/*loader 模块加载*/
	module: {
		rules: [
			{
				test: /\.(css|sass|scss)$/, //匹配所有css文件
				use: cssProd,
				exclude: /node_modules/ //excluder排除怼node下的文件的匹配
			},

		]
	},
	/*插件安装*/
	plugins: [
		/*每次进行打包的时候都把dist文件的内容进行清除*/
		new cleanWebpackPlugin(
			['dist'], //这里指每次清除dist文件夹的文件 匹配的文件夹
			{
				root: `${__dirname}/../`,//制定插件根目录位置 TODO 好恶心啊这种写法
				//verbose: true, //开启控制台输出
				dry: false//启用删除文件
			}
		),
		new HappyPack({
			id: 'css',
			verbose: true,
			threadPool: happyThreadPool,
			loaders: [
				{loader: 'css-loader', options: {importLoaders: 1, minimize: true}},
				{loader: 'postcss-loader'},
				{loader:'sass-loader'}
			]

		}),


		/*加载把css文件单独分离出来的插件*/
		new ExtractTextPlugin({
			filename: (getPath) => {
				return getPath('css/[name]-[contenthash:6].css').replace('css/js', 'css');
				/* [name] 根据html名字获取的css名字  contenthash:6加上hash:6值*/
			},
			allChunks: true
		}),
/*
		//css treeshaking
		new PurifyCSSPlugin({
			// 查找html文件
			paths: glob.sync(path.resolve(__dirname, '../src/page/!*.html'))
		}),
*/

		new BundleAnalyzerPlugin()
	],
});