import React, { Component } from 'react'
import styles from './Layout.module.css'
import { GuildNav, ChannelNav, Main, MemberNav } from './../'
const { ipcRenderer } = window.require('electron')

class Layout extends Component {
	constructor(props) {
		super(props)
		this.state = {
			currentGuild: null,
			currentChannel: null,
		}

		this.selectGuild = async id => {
			const { currentGuild: previousGuild } = this.state
			if (previousGuild && previousGuild.id === id) return
			const { currentGuild, currentChannel } = await ipcRenderer.invoke(
				'selectGuild',
				id
			)
			if (!currentGuild) return

			this.selectChannel(currentChannel.id, currentGuild.id)
			this.setState({
				...this.state,
				currentGuild: currentGuild,
				currentChannel: null,
			})
		}

		this.selectChannel = async id => {
			if (this.state.currentChannel?.id === id) return
			const currentChannel = await ipcRenderer.invoke('selectChannel', id)

			const allowedChannelTypes = ['GUILD_TEXT', 'GUILD_NEWS', 'DM']

			if (!currentChannel.viewable)
				return this.props.pushAlert({
					type: 'warning',
					message: `Channel ${currentChannel.name} [ID:${currentChannel.id}] is not viewable (missing permissions).`,
				})

			if (!allowedChannelTypes.includes(currentChannel.type))
				return this.props.pushAlert({
					type: 'warning',
					message: `Channel ${currentChannel.name} [ID:${currentChannel.id}] has an unsupported type: '${currentChannel.type}'`,
				})
			this.setState({ ...this.state, currentChannel: currentChannel })
		}
	}

	componentDidMount() {
		this.selectGuild()
	}

	render() {
		const { currentChannel, currentGuild } = this.state
		const { clientUser, pushAlert } = this.props
		return (
			<div className={styles.wrapper}>
				<GuildNav
					currentGuild={currentGuild}
					selectGuild={this.selectGuild}
					pushAlert={pushAlert}
				/>

				{currentGuild && currentChannel ? (
					<>
						<ChannelNav
							clientUser={clientUser}
							currentGuild={currentGuild}
							currentChannel={currentChannel}
							selectChannel={this.selectChannel}
							pushAlert={pushAlert}
						/>
						<Main
							currentChannel={currentChannel}
							currentGuild={currentGuild}
							pushAlert={pushAlert}
						/>
					</>
				) : null}
				{currentChannel && currentChannel.type !== 'DM' ? (
					<MemberNav currentChannel={currentChannel} />
				) : null}
			</div>
		)
	}
}

export default Layout
