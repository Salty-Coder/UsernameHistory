/**
 * @name UsernameHistory
 * @author salty
 * @authorId 409250840571019264
 * @version 1.0.0
 * @description Keep track of who is who by seeing your friends' username history.
 * @donate https://github.com/sponsors/Salty-Coder
 * @website https://github.com/Salty-Coder/UsernameHistory
 * @source https://raw.githubusercontent.com/Salty-Coder/UsernameHistory/main/UsernameHistory.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Salty-Coder/UsernameHistory/main/UsernameHistory.plugin.js
 */

const config = {
    info: {
        name: 'UsernameHistory',
        authors: [
            {
                name: 'salty',
                discord_id: '409250840571019264',
                github_username: 'Salty-Coder',
            },
        ],
        version: '1.0.0',
        description: 'Keep track of who is who by seeing your friends\' username history.',
        github: 'https://github.com/Salty-Coder/UsernameHistory',
        github_raw: 'https://raw.githubusercontent.com/Salty-Coder/UsernameHistory/main/UsernameHistory.plugin.js',
    },
    changelog: [
        {
            title: '1.0.0',
            type: 'added',
            items: [
                'Initial Release',
            ],
        }
    ],
};

const { Data, UI, Utils } = window.BdApi;
const {
	DiscordModules, DOMTools, Modals, Logger, Utilities,
} = window.ZLibrary;
const {
	React, Dispatcher, GuildStore, RelationshipStore, UserStore,
} = DiscordModules;

const subscribeTargets = [
	'FRIEND_REQUEST_ACCEPTED',
	'RELATIONSHIP_ADD',
	'RELATIONSHIP_UPDATE',
	'RELATIONSHIP_REMOVE',
];
let currentSavedData;
let isUpdating = false;
let isImporting = false;


let NoZLibrary;
if (!global.ZeresPluginLibrary) {
    const { BdApi } = window;
    NoZLibrary = () => ({
        getName() { return config.info.name; },
        getAuthor() { return config.info.authors.map((a) => a.name).join(', '); },
        getDescription() { return config.info.description; },
        getVersion() { return config.info.version; },
        load() {
            BdApi.UI.showConfirmationModal(
                'Library Missing',
                `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
                {
                    confirmText: 'Download Now',
                    cancelText: 'Cancel',
                    onConfirm: () => {
                        require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                            if (error) return require('electron').shell.openExternal('https://betterdiscord.app/Download?id=9');
                            await new Promise((r) => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                        });
                    },
                },
            );
        },
        start() {},
        stop() {},
    });
}



module.exports = (!global.ZeresPluginLibrary) ? NoZLibrary : (_ => {
	const changeLog = {
		
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var _this;
		var currentPopout, currentProfile;
		const UsernameHistoryComponents = class UsernameHistory extends BdApi.React.Component {
			render() {

				//var currentStoredData = getSavedData() || {friendCache: {}};
				var currentStoredData = Data.load(`${config.info.name}_db`, 'savedData') || {friendCache: {}};
				if(!currentStoredData.friendCache[this.props.user.id]) return null; // If no data is saved for this user, ont display anything

				const tags = [...currentStoredData.friendCache[this.props.user.id].tags].reverse();

				let icon = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
                    className: BDFDB.disCN._lastmessagedateicon,
					nativeClass: false,
					name: BDFDB.LibraryComponents.SvgIcon.Names.PENCIL
				});
				return BDFDB.ReactUtils.createElement(this.props.isInPopout ? BDFDB.LibraryComponents.UserPopoutSection : BDFDB.ReactUtils.Fragment, {
					children: [
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Heading, {
							className: !this.props.isInPopout ? BDFDB.disCN.userprofileinfosectionheader : BDFDB.disCN.userpopoutsectiontitle,
							variant: "eyebrow",
							children: _this.labels.username_history
						}),
						tags.map(tag => (
							BDFDB.ReactUtils.createElement("div", {
							  className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.membersince, !this.props.isInPopout && BDFDB.disCN.userprofileinfotext),
							  children: [
								icon,
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Text, {
								  className: this.props.isInPopout && BDFDB.disCN.userpopoutsectionbody,
								  variant: "text-sm/normal",
								  children: tag // Use the tag value as Body text
								})
							  ]
							})
						))
					]
				});
			}
		};
		

		


		const getSavedData = () => {
			const savedData = Data.load(`${config.info.name}_db`, 'savedData');
			if (!savedData) return undefined;
	
			const currentSavedDataInterpret = {
				friendCache: savedData.friendCache,
			};
	
			return currentSavedDataInterpret;
		};

		const setSavedData = () => {
			var currentStoredData = Data.load(`${config.info.name}_db`, 'savedData') || {friendCache: {}};
			//var currentStoredData = getSavedData(currentUserId) || {friendCache: {}};
	
			let newFriendUsernames = {
				friendCache: currentSavedData.friendCache,
			};
	
			newFriendUsernames = newFriendUsernames.friendCache;
	
	
			for(var userId in newFriendUsernames){
				var currentTag = newFriendUsernames[userId].tag
				if(!currentStoredData.friendCache.hasOwnProperty(userId)){
					currentStoredData.friendCache[userId] = {"tags": [currentTag]}
				}else{
					if(!currentStoredData.friendCache[userId]){ currentStoredData.friendCache[userId].tags.push(currentTag)
					}else if(!currentStoredData.friendCache[userId].tags.includes(currentTag)){
						currentStoredData.friendCache[userId].tags.push(currentTag)
					}
				}
			}
			return Data.save(`${config.info.name}_db`, 'savedData', currentStoredData);
			//return Data.save(`${config.info.name}_test`, 'savedData', {friendCache: {}});
			//return Data.save(`${config.info.name}_test`, 'savedData', {friendCache: {  "": {"tags": [""]}}});
		};


		const getFriendsList = () => {
			const relationships = RelationshipStore.getFriendIDs();
			const friendsArr = {};
			const friendsSet = new Set();
	
			relationships.forEach((relationship) => {
				const user = UserStore.getUser(relationship.toString());
				if (user) {
					const filteredUser = {
						//id: user.id,
						tag: (user.discriminator != 0) ? `${user.username}#${user.discriminator}` : user.username,
					};
					friendsArr[user.id] = filteredUser;
				}
			});
	
			return { friendsArr, friendsSet };
		};




		const populateEmptyCurrentSavedData = () => {
			const friendsList = getFriendsList();
			currentSavedData.friendCache = friendsList.friendsArr;
	
			// eslint-disable-next-line max-len
			Logger.info(config.info.name, `Caching ${friendsList.friendsSet.size} friends`);
		};
	
		const initializeCurrentSavedData = () => {
			const savedDataInFile = getSavedData();
			const savedData = {
				friendCache: [],
			};
	
			if (!savedDataInFile) {   // If no data is already stored in json:
				currentSavedData = savedData; // Current saved data = []
				populateEmptyCurrentSavedData(); // If no saved data, create new data
			} else {            // If saved data is present in json file:
				currentSavedData = savedDataInFile;  // Current saved data = the current data from json file
			}
		};
	
		const compareAndUpdateCurrentSavedData = () => {
			if (isUpdating === true) return null;
			if (isImporting === true) return null;
			isUpdating = true;
			try {
				const friends = getFriendsList();
	
				currentSavedData.friendCache = friends.friendsArr;
				setSavedData();
	
			} catch (e) {
				Logger.stacktrace(config.info.name, 'Exception occurred while updating cache', e);
				throw e;
			} finally {
				isUpdating = false;
			}
	
			return;
		};





		const update = () => {
			compareAndUpdateCurrentSavedData();
		};






		return class UsernameHistory extends Plugin {
			onLoad () {
				_this = this;

				this.defaults = {
					places: {
						userPopout:				{value: true, 			description: "User Popouts"},
						userProfile:			{value: true, 			description: "User Profile Modal"}
					}
				};
			
				this.modulePatches = {
					before: [
						"UserPopout",
						"UserProfile"
					],
					after: [
						"UserMemberSinceSection",
						"UserProfileBody"
					]
				};
				
				this.css = `
					${BDFDB.dotCN._lastmessagedateicon} {
						width: 16px;
						height: 16px;
						color: var(--interactive-normal);
					}
				`;
			}
			
			onStart () {

				var lastExecutionTimestamp = new Date().getTime().toString();

				const tenHoursInMilliseconds = 10 * 60 * 60 * 1000; // 10 hours in milliseconds

				initializeCurrentSavedData();


				subscribeTargets.forEach((e) => Dispatcher.subscribe(e, update));
				update();


				// Loop
				setInterval(() => {
					const currentTime = new Date().getTime();
					const timeDifference = currentTime - parseInt(lastExecutionTimestamp, 10);
				
					if (timeDifference >= tenHoursInMilliseconds) {
					// Execute the function
					update();
				
					// Update the last execution timestamp
					lastExecutionTimestamp =  currentTime.toString();
					}
				}, 60 * 60 * 1000); // Check every hour
				}
			
			onStop () {
				//BDFDB.PatchUtils.forceAllUpdates(this);
				subscribeTargets.forEach((e) => Dispatcher.unsubscribe(e, update));
			}

			processUserPopout (e) {
				currentPopout = e.instance;
			}

			processUserMemberSinceSection (e) {
				if (!currentPopout) return;
				let user = e.instance.props.user || BDFDB.LibraryStores.UserStore.getUser(e.instance.props.userId);
				if (!user || user.isNonUserBot()) return;
				e.returnvalue = [
					BDFDB.ReactUtils.createElement(UsernameHistoryComponents, {
						isInPopout: true,
						guildId: currentPopout.props.guildId || BDFDB.DiscordConstants.ME,
						channelId: currentPopout.props.channelId,
						isGuild: !!currentPopout.props.guildId,
						user: user
					}, true),
					e.returnvalue
				];
			}

			processUserProfile (e) {
				currentProfile = e.instance;
			}

			processUserProfileBody (e) {
				if (!currentProfile) return;
				let user = e.instance.props.user || BDFDB.LibraryStores.UserStore.getUser(e.instance.props.userId);
				if (!user || user.isNonUserBot()) return;
				let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {name: "UserMemberSince"});
				if (index > -1) children.splice(index, 0, BDFDB.ReactUtils.createElement(UsernameHistoryComponents, {
					isInPopout: false,
					guildId: currentPopout.props.guildId || BDFDB.DiscordConstants.ME,
					channelId: currentPopout.props.channelId,
					isGuild: !!currentPopout.props.guildId,
					user: user
				}, true));
			}

			setLabelsByLanguage () {
				return {
					username_history: "Username History"
				};
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
