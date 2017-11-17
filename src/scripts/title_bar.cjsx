cx = require "classnames"
Bem = require "./berrymotes.jsx"

formatTime = (seconds) ->
	hours = Math.floor(seconds / 60 / 60)
	minutes = Math.floor(seconds / 60) % 60
	seconds = Math.floor(seconds % 60)
	time = seconds + 's'
	if minutes > 0
		time = minutes + 'm' + time
	if hours > 0
		time = hours + 'h' + time
	time

module.exports = React.createClass
	displayName: 'TitleBar'

	getInitialState: ->
		menuOpen: false

	showBMSettings: ->

	toggleMenu: -> @setState(menuOpen: !@state.menuOpen)

	render: ->
		pollClass =
			"notify": @props.polls.length && !@props.polls[@props.polls.length-1].inactive && !@props.polls[@props.polls.length-1].voted?

		squeeClass =
			"notify": @props.squees.length

		modchatClass =
			"notify": @props.activeChat != 'main'

		videoURL = =>
			time = ''
			if @props.currentVideo?.time?.pos
				seconds = @props.currentVideo.time.pos + (Date.now() - @props.currentVideo.time.when) / 1000
				time = '#t=' + formatTime(seconds)

			switch @props.currentVideo?.videotype
				when 'yt' then 'https://www.youtube.com/watch?v=' + @props.currentVideo.videoid + time
				when 'vimeo' then 'https://vimeo.com/' + @props.currentVideo.videoid + time
				when 'dm' then 'https://www.dailymotion.com/video/' + @props.currentVideo.videoid
				when 'osmf' then @props.currentVideo.videoid
				when 'soundcloud' then 'https://atte.fi/soundcloud/?' + @props.currentVideo.videoid.substr(2)

		onVideoClick = (event) ->
			window.open(videoURL())
			event.preventDefault()

		nowPlaying =
			<span className="now-playing">
				Now playing:&nbsp;
				<a target="_blank" href={videoURL()} onClick={onVideoClick}>
					{decodeURIComponent(decodeURIComponent(@props.currentVideo?.videotitle || 'Connecting...'))}
				</a>
				<span className={"drink-count #{"hidden" unless @props.drinkCount}"}>
					({@props.drinkCount} Drinks)
				</span>
			</span>

		dropdown =
			<ul className="dropdown-menu">
				<li><a onClick={@props.onClickEmotes}><i className="material-icons">favorite</i> {if @props.emotesEnabled then "Disable" else "Enable"} Emotes</a></li>
				<li><a onClick={Bem.dataRefresh}><i className="material-icons">refresh</i> Refresh Emotes</a></li>
				{if window.nativeApp then <li className="divider"></li>}
				{if window.nativeApp then <li><a onClick={@showDevTools}><i className="material-icons">build</i> Show Devtools</a></li>}
				<li className="divider"></li>
				<li ng-show="User" ><a ng-click="logout()"><i className="material-icons">exit_to_app</i> Logout</a></li>
			</ul>

		<div id="title-bar" ng-controller="TitleBarCtrl">
			<img className="icon" src="favicon.png"/>
			<span className="title">
				BerryTube {nowPlaying}
			</span>
			<div className="menu">
				{if @props.viewer?.isSpike
					<span className={cx(modchatClass)} title="Toggle Modchat" onClick={@props.onClickModchat}>
						<i className="material-icons">security</i>
					</span>}
				<span className={cx(squeeClass)} title="Toggle Squees" onClick={@props.onClickSquees}>
					<i className="material-icons">mail</i>
				</span>
				<span className={cx(pollClass)} title="Toggle Polls" onClick={@props.onClickPollsBtn}>
					<i className="material-icons">check_box</i>
				</span>
				<span title="Toggle user list" onClick={@props.onClickUserBtn}>
					<i className="material-icons">people</i>
				</span>
				<span title="Toggle playlist" onClick={@props.onClickPlaylistBtn}>
					<i className="material-icons">video_library</i>
				</span>
				<span className="mdl-button mdl-button--icon" onClick={@toggleMenu}>
					<i className="material-icons">more_vert</i>
					{if @state.menuOpen then dropdown}
				</span>
			</div>
		</div>
