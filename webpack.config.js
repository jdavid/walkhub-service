"use strict";

var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var serverConfig = {};
try {
	serverConfig = require("./config.json");
} catch (e) {
	console.log(e);
}
var contentpages = process.env.CONTENTPAGES || serverConfig.contentpages;
var menuitems = process.env.MENUITEMS || serverConfig.menuitems;
var frontpagecomponent = process.env.FRONTPAGECOMPONENT || serverConfig.frontpagecomponent;
var footercomponent = process.env.FOOTERCOMPONENT || serverConfig.footercomponent;
var announcementcomponent = process.env.ANNOUNCEMENTCOMPONENT || serverConfig.announcementcomponent;
var baseurl = process.env.BASEURL || serverConfig.baseurl;
var extensionid = process.env.EXTENSIONID || serverConfig.extensionid;
var embedurl = process.env.EMBEDURL || serverConfig.embedurl;
var httporigin = process.env.HTTPORIGIN || serverConfig.httporigin;
var gaAccount = process.env.GOOGLEANALYTICSACCOUNT || serverConfig.googleanalyticsaccount;
var extraBuild = process.env.EXTRABUILD || serverConfig.extrabuild;
var disableRegistration = process.env.DISABLEREGISTRATION || serverConfig.disableregistration;
var languages = process.env.LANGUAGES || serverConfig.languages;
var domain = process.env.DOMAIN || serverConfig.domain;

var isProd = process.env.NODE_ENV === "production";

var path = require("path");
var srcPath = path.join(__dirname, "js");
var compassPath = path.resolve(__dirname, "./node_modules/compass-mixins/lib");
var sassPath = path.resolve(__dirname, "sass");
var sassIncludePaths = "includePaths[]="+compassPath+"&includePaths[]="+sassPath;

var loaders = [
	{
		test: /\.js?$/,
		exclude: [/node_modules/, /bootstrap\.config\.js/],
		loader: "babel-loader"
	},
	{ test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
	{ test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
	{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
	{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
	{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=image/svg+xml" },
	{ test: /\.less$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
	{ test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
	{ test: /\.scss$/, loader: "style!css!sass?"+sassIncludePaths },
	{ test: /\.sass$/, loader: "style!css!sass?indentedSyntax&"+sassIncludePaths },
	{ test: /.*\.(gif|png|jpe?g|ico)$/i, loader: "file?name=[name]-[sha512:hash:hex:6].[ext]" },
	{ test: /\.md$/, loader: "babel-loader!react-markdown!markdown" },
	{ test: /\.json$/, loader: 'json' }
];

if (contentpages) {
	loaders.push({
		test: function(absPath) {
			return absPath.endsWith(contentpages);
		},
		loader: "contentpageconfig"
	});
}

if (menuitems) {
	loaders.push({
		test: function(absPath) {
			return absPath.endsWith(menuitems);
		},
		loader: "json"
	});
}

module.exports = {
	target: "web",
	cache: true,
	entry: {
		app: [
			"react",
			"react-router",
			"alt",
			"bootstrap-webpack!"+path.join(__dirname, "bootstrap.config.js"),
			"less/helpcenter.less",
			"walkthrough.scss",
			path.join(srcPath, "module.js")
		],
		client: [
			"walkthrough.scss",
			"client/walkthrough_start"
		],
		embed: [
			"client/embed"
		]
	},
	resolve: {
		alias: {
			CONTENT_PAGES: contentpages,
			MENU_ITEMS: menuitems,
			FRONT_PAGE: frontpagecomponent || "components/frontpage",
			FOOTER: footercomponent,
			ANNOUNCEMENT: announcementcomponent,
			flux: "flux/index",
		},
		root: srcPath,
		extensions: ["", ".js", ".less"],
		modulesDirectories: ["node_modules", "js", "sass", "."],
	},
	output: {
		path: path.join(__dirname, "assets"),
		publicPath: baseurl + "assets/",
		filename: "[name].js",
		pathInfo: true
	},
	module: {
		loaders: loaders
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery"
		}),
		new ExtractTextPlugin("[name].css"),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html?attrs[]=link:href&-removeOptionalTags!html/index.html",
			chunks: ["app"],
			hash: true
		}),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html?-removeOptionalTags!html/start.html",
			chunks: ["client"],
			filename: "start.html",
			hash: true
		}),
		new webpack.DefinePlugin({
			WALKHUB_URL: JSON.stringify(baseurl),
			WALKHUB_EMBED_URL: JSON.stringify(embedurl ? embedurl : baseurl),
			WALKHUB_HTTP_URL: JSON.stringify(httporigin ? httporigin : baseurl),
			EXTENSIONID: JSON.stringify(extensionid),
			WALKHUB_MENU_ITEMS: !!menuitems,
			WALKHUB_CONTENT_PAGES: !!contentpages,
			GA_ACCOUNT: JSON.stringify(gaAccount),
			WALKHUB_CUSTOM_FOOTER: !!footercomponent,
			WALKHUB_ANNOUNCEMENT: !!announcementcomponent,
			DISABLE_REGISTRATION: !!disableRegistration,
			LANGUAGES: JSON.stringify(languages),
			DOMAIN: JSON.stringify(domain),
		}),
		new webpack.NoErrorsPlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				drop_debugger: isProd,
			},
			comments: false,
			mangle: {
				except: [
					"$",
					"AuthProviderStore",
					"CurrentUserStore",
					"EmbedLogStore",
					"LogStore",
					"RemoteStore",
					"SearchStore",
					"UserStore",
					"WalkthroughStore",
					"debugger",
				],
			},
		}),
	],
	resolveLoader: {
		extensions: ["", ".js"],
		modulesDirectories: ["node_modules", "js/build"]
	},
	debug: !isProd,
	devtool: isProd ? null : "source-map",
};

if (extraBuild) {
	require(extraBuild)(module.exports);
}
