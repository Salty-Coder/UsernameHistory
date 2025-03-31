/**
 * @name UsernameHistory
 * @author salty
 * @authorId 409250840571019264
 * @version 1.1.0
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
        version: '1.1.0',
        description: 'Keep track of who is who by seeing your friends\' username history.',
        github: 'https://github.com/Salty-Coder/UsernameHistory',
        github_raw: 'https://raw.githubusercontent.com/Salty-Coder/UsernameHistory/main/UsernameHistory.plugin.js',
    },
    changelog: [
		{
            title: '1.1.0',
            type: 'progress',
            items: [
                'Fixed and enhanced.',
            ],
        }
    ],
};

const { BdApi } = window;

const { Data, UI, Utils, DOM } = BdApi;

const {Webpack} = BdApi;
const UserStore = Webpack.getStore("UserStore");
const RelationshipStore = Webpack.getStore("RelationshipStore");

const subscribeTargets = [
	'FRIEND_REQUEST_ACCEPTED',
	'RELATIONSHIP_ADD',
	'RELATIONSHIP_UPDATE',
	'RELATIONSHIP_REMOVE',
];

let currentCachedData;  // Cached while running plugin
let isUpdating = false;
let isImporting = false;

const [ abort, getSignal ] = (function () {
	let controller = new AbortController();

	function abort(reason) {
	  controller.abort(reason);
	  controller = new AbortController();
	}

	return [abort, () => controller.signal];
  })();

// Returns the data currently stored in the db file
const getStoredData = () => { 
	const storedData = Data.load(`${config.info.name}_db`, 'savedData');
	if (!storedData) return undefined;
	return storedData;
};


const getFriendsList = () => {
	const relationships = RelationshipStore.getFriendIDs();
	const friendsArr = {};

	relationships.forEach((relationship) => {
		const user = UserStore.getUser(relationship.toString());
		if (user) {
			const filteredUser = {
				username: user.username,
			};
			friendsArr[user.id] = filteredUser;
		}
	});

	return { friendsArr };
};

// Sets cached data to currently friend list
const populateEmptyCurrentSavedData = () => {
	const friendsList = getFriendsList();
	currentCachedData.friendCache = friendsList.friendsArr;
	console.log(`UsernameHistory: Caching ${Object.keys(friendsList.friendsArr).length} friends.`);
};

const initializeCurrentCachedData = () => {  // Ran first
	const storedDataInFile = getStoredData();

	if (!storedDataInFile) {   // If no data is already stored in json file:
		const emptyCachedData = {friendCache: []};
		currentCachedData = emptyCachedData; // Current memory saved data = []
		populateEmptyCurrentSavedData(); // Populate the empty table
	} else {            // If saved data is present in json file:
		currentCachedData = storedDataInFile;  // Current memory data = the current data from json file
	}
	compareAndUpdateCurrentCachedData()
};

const compareAndUpdateCurrentCachedData = () => {  // Ran after initializeCurrentCachedData and looped
	if (isUpdating === true || isImporting === true) return null;
    isUpdating = true;
	try {
		
		let currentStoredData = getStoredData() || { friendCache: {} }; // Load stored data
        let currentFriendUsernames = getFriendsList().friendsArr; // Get current friend data

		for (let userId in currentFriendUsernames) {
            let currentUsername = currentFriendUsernames[userId].username;

            if (!currentStoredData.friendCache.hasOwnProperty(userId)) {
                // If the user is not in the database at all, add them
                currentStoredData.friendCache[userId] = { "usernames": [currentUsername] };
            } else {
                // If the user exists, check if the username is new
                if (!currentStoredData.friendCache[userId].usernames.includes(currentUsername)) {
                    currentStoredData.friendCache[userId].usernames.push(currentUsername);
                }
            }
        }
		currentCachedData = currentStoredData; // Update memory cache
        Data.save(`${config.info.name}_db`, 'savedData', currentStoredData); // Save to db file



	} catch (e) {
		console.error("Error updating friend username data:", e);
		throw e;
	} finally {
		isUpdating = false;
	}

	return;
};





let Text = BdApi.Webpack.getBySource("data-text-variant", "=\"div\",selectable:", { defaultExport: false });
if (!Text.render) Text = Object.values(Text)[0];


const {intl} = BdApi.Webpack.getMangled(".IntlManager(", {
    intl: m => m?.currentLocale
});

function getMessage() {
	switch (intl.currentLocale) {
    	default: return "Username History";
	}
}


// Custom Section Component
class UsernameHistorySection extends BdApi.React.Component {
  constructor(props) {
	super(props);

  }

  state = { hasError: false };

  UNHistory = null

  render() {
    if (this.state.hasError) return BdApi.React.createElement("div", {}, "React Error");
	const { userId, currentName} = this.props;
	if (!currentCachedData.friendCache || !currentCachedData.friendCache[userId]) return null;

	const userData = currentCachedData.friendCache[userId];

	if(userData.usernames.includes(currentName)){
		const index = userData.usernames.indexOf(currentName);
		if (index > -1) { // only splice array when item is found
			userData.usernames.splice(index, 1); // 2nd parameter means remove one item only
		}
	}

	return BdApi.React.createElement(Section, {
		heading: getMessage(),
		headingColor: this.props.sidePanel ? "header-primary" : undefined,
		children: [
			userData.usernames.slice().reverse().map((username, index) => 
				BdApi.React.createElement("div", { key: index, style: { display: "flex", alignItems: "center" } },
					BdApi.React.createElement("svg", { 
						width: 20, height: 20, viewBox: "0 0 24 24", style: { marginRight: "5px" } 
					}, 
						BdApi.React.createElement("path", { fill: "white", d: "M8.707 19.707 18 10.414 13.586 6l-9.293 9.293a1.003 1.003 0 0 0-.263.464L3 21l5.242-1.03c.176-.044.337-.135.465-.263zM21 7.414a2 2 0 0 0 0-2.828L19.414 3a2 2 0 0 0-2.828 0L15 4.586 19.414 9 21 7.414z" })
					),
					BdApi.React.createElement(Text, { variant: "text-sm/normal" }, username)
				)
			)
		]
	})
  }
}










let UserModalContent;
async function patchUserModal(signal) {
    if (!UserModalContent) {
		UserModalContent = await BdApi.Webpack.waitForModule(
			BdApi.Webpack.Filters.byStrings("3fe7U1", "trackUserProfileAction"),
			{ defaultExport: false }
		);
        
		if (!("default" in UserModalContent)) {
            Object.defineProperty(UserModalContent, "default", {
                get() {
                    return UserModalContent.Z || UserModalContent.ZP;
                },
                set(value) {
                    if ("Z" in UserModalContent) UserModalContent.Z = value;
                    if ("ZP" in UserModalContent) UserModalContent.ZP = value;
                }
            });
        }
    }

    if (signal.aborted) return;

    BdApi.Patcher.after("UsernameHistory", UserModalContent, "default", (instance, [props], res) => {
        if (!BdApi.React.isValidElement(res)) return;
        const children = res.props.children;

		const index = children.findIndex(
			(value) =>
			  BdApi.React.isValidElement(value) &&
			  "heading" in value.props &&
			  BdApi.React.isValidElement(value.props.children) &&
			  "tooltipDelay" in value.props.children.props
		  );

        if (~index) {
			Section = children[index].type;

            children.splice(
                index + 1, 0,
                BdApi.React.createElement(UsernameHistorySection, {
					userId: props.user.id,
					currentName: props.user.username
				})
            );
        }
    });
}



let UserSidePanel;
async function patchSidePanel(signal) {
    if (!UserSidePanel) {
    	UserSidePanel = await BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings("61W33d", "UserProfilePanelBody"), { defaultExport: false });

      	if (!("default" in UserSidePanel)) {
        	Object.defineProperty(UserSidePanel, "default", {
          		get() {
            		return UserSidePanel.Z || UserSidePanel.ZP;
          		},
          		set(value) {
            		if ("Z" in UserSidePanel) UserSidePanel.Z = value;
            		if ("ZP" in UserSidePanel) UserSidePanel.ZP = value;
          		}
        	});
      	};
    }

    if (signal.aborted) return;

    BdApi.Patcher.after("UsernameHistory", UserSidePanel, "default", (instance, [ props, abc ], res) => {
      if (!BdApi.React.isValidElement(res)) return;

      const background = res.props.children.find((value) => String(value?.props?.className).includes("overlay_"));
      if (!background) return;
      
      const index = background.props.children.findIndex((value) => BdApi.React.isValidElement(value) && "heading" in value.props);

      if (~index) {        
        Section = background.props.children[index].type;
        
        background.props.children.push(
          BdApi.React.createElement(UsernameHistorySection, {
            userId: props.user.id,
			currentName: props.user.username,
            sidePanel: true
          })
        );
      }
    });
  }










module.exports = class UsernameHistory {

	constructor(meta) {
		this.meta = meta;
		this.config = config;
	}

	getName() { return this.config.info.name; }
    getAuthor() { return this.config.info.authors.map((a) => a.name).join(', '); }
    getVersion() { return this.config.info.version; }
    getDescription() { return this.config.info.description; }


	start () {

		const lastVersion = Data.load(config.info.name, 'lastVersion');
        if (lastVersion !== this.meta.version) {
            BdApi.UI.showChangelogModal({
                title: this.meta.name,
                subtitle: this.meta.version,
                changes: config.changelog
            });
            BdApi.Data.save(config.info.name, 'lastVersion', this.meta.version);
		}


		const signal = getSignal();
		patchUserModal(signal);
		patchSidePanel(signal)

		BdApi.Patcher.before("UsernameHistory", BdApi.findModuleByProps("dispatch"), "dispatch", (thisObject, [event]) => {
			if (subscribeTargets.includes(event.type)) {
				update(event);
			}
		});

		initializeCurrentCachedData();

		var lastExecutionTimestamp = new Date().getTime().toString();

		const tenHoursInMilliseconds = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
		// Loop
		setInterval(() => {
			const currentTime = new Date().getTime();
			const timeDifference = currentTime - parseInt(lastExecutionTimestamp, 10);
				
			if (timeDifference >= tenHoursInMilliseconds) {
				compareAndUpdateCurrentCachedData();
				// Update the last execution timestamp
				lastExecutionTimestamp =  currentTime.toString();
			}
			}, 60 * 60 * 1000); // Loop every hour - incase of pc sleep etc causing missed caches



	}


			

	stop () {
		abort()
		BdApi.Patcher.unpatchAll("UsernameHistory");
	}

}