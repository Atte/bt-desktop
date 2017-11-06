let React = require("react")
let cx = require("classnames")

let Bem = require("./berrymotes.jsx")
let {EmoteParser, EmoteHtml} = require("emotes")
let parser = new EmoteParser()
let html = Bem.map && new EmoteHtml(Bem.map)
const MAX_HEIGHT = 200

module.exports = class Emote extends React.Component {
	constructor(props) {
		super(props)
		html = Bem.map && new EmoteHtml(Bem.map)

		// emoteId will be set when this is used via search results
		var emoteToParse = props.emote || `[](/${props.emoteId})`
		this.state = this.getStateFromEmoteString(emoteToParse)
		Bem.on("update", this.onEmoteUpdate.bind(this))
	}

	getStateFromEmoteString(emoteString) {
		var emoteIdentifier, originalString, htmlOutputData
		let emoteObject = parser.parse(emoteString)
		emoteIdentifier = emoteObject.emoteIdentifier
		originalString = emoteObject.originalString
		htmlOutputData = html && html.getEmoteHtmlMetadataForObject(emoteObject)
		return {
			originalString,
			emoteIdentifier,
			htmlOutputData
		}
	}

	onEmoteUpdate() {
		html = html || new EmoteHtml(Bem.map)
		let state = this.getStateFromEmoteString(this.state.originalString)
		this.setState(state)
	}

	render() {
		let htmlOutputData = this.state.htmlOutputData
		if(!htmlOutputData) {
			return <span>{this.state.originalString}</span>
		}

		let emoteData = this.state.htmlOutputData.emoteData

		let textNodes = []

		if (htmlOutputData.emText) {
			textNodes.push(<em style={htmlOutputData.emStyles}>{htmlOutputData.emText}</em>)
		}
		if (htmlOutputData.strongText) {
			textNodes.push(<strong style={htmlOutputData.strongStyles}>{htmlOutputData.strongText}</strong>)
		}
		if (htmlOutputData.altText) {
			textNodes.push(htmlOutputData.altText)
		}

		let emoteNode = (
			<span ref="emote"
						onClick={this.props.emoteSelected && this.props.emoteSelected.bind(this, this.props.emoteIdentifier)}
						className={cx(htmlOutputData.cssClassesForEmoteNode)}
						title={htmlOutputData.titleForEmoteNode}
						style={htmlOutputData.cssStylesForEmoteNode}>
				{textNodes}
			</span>
		)

		// provide a wrapper node if necessary to apply the styles/classes from the 'parent node' info
		if (htmlOutputData.cssClassesForParentNode.length > 0 || htmlOutputData.cssStylesForParentNode) {
			emoteNode = (
				<span className={cx(htmlOutputData.cssClassesForParentNode)} style={htmlOutputData.cssStylesForParentNode}>
					{emoteNode}
				</span>
			)
		}

		// provide wrapping to implement scaling down to meet MAX_HEIGHT requirement
		if (emoteData.height > MAX_HEIGHT) {
			let scale = MAX_HEIGHT/emoteData.height

			let outerWrapperStyle = {
				height: MAX_HEIGHT,
				width: emoteData.width * scale,
				position: "relative",
				display: "inline-block"
			}

			let innerWrapperStyle = {
				transform: `scale(${scale})`,
				transformOrigin: "left top 0px",
				position: "absolute",
				top: 0,
				left: 0
			}

			emoteNode = (
				<span className="berrymotes-wrapper-outer" style={outerWrapperStyle}>
					<span className="berrymotes-wrapper" style={innerWrapperStyle}>
						{emoteNode}
					</span>
				</span>
			)
		}

		return emoteNode
	}
}
