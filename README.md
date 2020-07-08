# coronivia
An open source, online trivia game that friends can play casual trivia games while Zooming, Teaming, Skyping, etc. The name, Coronivia, is a nod to the special times and circumstances that led to the strong need for online distractions with friends, families and colleagues. 

[See Releases](#releases)

## The Game
Coronivia is a game for 1 to 1 million players (might need some load testing and some sponsored hosting for the million player games). The landing page will have a very simple interface to either:
* __Create a game__

    If you create a game, you are the owner.  Owners get to specify their player name, the number of rounds, number of questions per round and the categories for each round. Number of questions per round ranges from 1 to 50 (see [Open Trivia Database API](https://opentdb.com/) for constraints). Number of rounds will be capped at a sensible 10.

    Additional ideas for room creation: length of countdown timer, allow players to join games in __Playing state__.

    * __Waiting Room State__
    
        Creating a game will result in a game being created in a __waiting room__ state with a displayed Join Game Code.  This will be a 4 character alfa-numeric code that can be sent to other players invited to the game. The game options, specified by the owner, will show to all who are in the waiting room.

        As players join the waiting room, their names will appear in the waiting room. See __Join a game__ below for more details.              
        
        When the owner deems that all of the players have arrived, she clicks the __start game__ button and the game is moved to __playing__ state. No additional players can join the game at this point. 

        Additionally, the owner has a __cancel game__ option. The owner will be prompted if she really wants to cancel the game and if so the room is removed and a confirmation message is displayed.

    * __Playing State__

        Entering into the playing state, disclaimers/messages/instructions are shown to all players.  All Players then see a __Starting Round 1__ message, followed by a __Question 1__ message. Question 1 is displayed, with a 15 second countdown timer. Players select an answer and click __submit answer__. A __ answer submitted, waiting to score...__ string replaces the submit button to indicate a successful answer submission.

        At the end of the countdown, the correct answer is revealed and players receive a notice if they got the answer correct and how many points they received.

        If there is more than 1 question defined for the round, after a slight delay of __10 seconds__, Question 2 is displayed and proceeds as above.  This cycle repeats until the number of questions defined for the round have been shown and scored. This is the end of the round. If there are more than 100 players, only show the top 100 players.

        If there is more than 1 Round defined, the Owner now sees a start Round 2 button on their screen.  Click this button starts Round 2 and play proceeds as with Round 1.  This cycle repeats for the number of defined Rounds have been completed.

    * __End Game State__

        Once all Rounds have been completed, players are shown the a display of final scores.  If more that 100 players, players see the top 100 and then their own place. Players names are bolded in the list. The winner is highlighted at the top of the list with some bling. 
        

* __Join a game__

    Join a game allows a user to enter a four character Join Game Code to enter a non-started game. Players are prompted for their player name and are then placed in the waiting room.


## Releases
__v0.0.10 - Current__

Bug fixes
* #[](https://github.com/coolcoastcat/coronivia/issues/) - 

Enhancements
* #[](https://github.com/coolcoastcat/coronivia/issues/) - 


Known Issues
* [Issues List](https://github.com/coolcoastcat/coronivia/projects/1?card_filter_query=label%3Abug)

__v0.0.9__

Bug fixes
* #[64](https://github.com/coolcoastcat/coronivia/issues/64) - Fix Question dialogs so titles don't bounce around.
* #[67](https://github.com/coolcoastcat/coronivia/issues/67) - Clicking on answers allows earning points
* #[68](https://github.com/coolcoastcat/coronivia/issues/68) - Add try/catch around game room access on server.

Enhancements
* #[61](https://github.com/coolcoastcat/coronivia/issues/61) - Show a snackbar when new user joins waiting room
* #[63](https://github.com/coolcoastcat/coronivia/issues/63) - Leave answers showing when submitting
* #[66](https://github.com/coolcoastcat/coronivia/issues/66) - Sticky Options


__v0.0.8__

Bug fixes
* #[42](https://github.com/coolcoastcat/coronivia/issues/42) - Socket closure on Game component unload
* #[50](https://github.com/coolcoastcat/coronivia/issues/50) - AlertDialog allows licking outside the window to close, leaving blank screen
* #[52](https://github.com/coolcoastcat/coronivia/issues/52) - Submit answer without clicking radio explodes
* #[56](https://github.com/coolcoastcat/coronivia/issues/56) - On Game start, check if user's socket is disconnected and reconnect

Enhancements
* #[16](https://github.com/coolcoastcat/coronivia/issues/16) - Under advanced game options allow an answer 5, which randomly picks one of the other 4 answers.
* #[20](https://github.com/coolcoastcat/coronivia/issues/20 ) - Add winston or pino logging to coronivia-server.js
* #[24](https://github.com/coolcoastcat/coronivia/issues/24) - Enable Advanced option for Owner to set question timeout 
* #[35](https://github.com/coolcoastcat/coronivia/issues/35) - Make question countdown seconds configurable as an advanced option.
* #[39](https://github.com/coolcoastcat/coronivia/issues/39) - Add a trophy icon to the winner's dialog 
* #[47](https://github.com/coolcoastcat/coronivia/issues/47) - Log game data to server log file
* #[51](https://github.com/coolcoastcat/coronivia/issues/51) - Clean up coronivia-server.js logging
* #[53](https://github.com/coolcoastcat/coronivia/issues/53) - When last user leaves the game, remove game from server. 
* #[54](https://github.com/coolcoastcat/coronivia/issues/54) - Show player list scores on the winners screen
* #[57](https://github.com/coolcoastcat/coronivia/issues/57) - Make question text smaller for more optimal mobile display
* #[58](https://github.com/coolcoastcat/coronivia/issues/58) - Enable submit when clicking radio 
* #[59](https://github.com/coolcoastcat/coronivia/issues/59) - Sort player list by descending score

__v0.0.7__

Bug fixes
* Cleaned up unused files
* Resolved linting complaints
* #[37](https://github.com/coolcoastcat/coronivia/issues/37) - Can't stay once Player clicks leave game from Waiting room.
* #[36](https://github.com/coolcoastcat/coronivia/issues/36) - Question Categories are not shuffled.
* #[34](https://github.com/coolcoastcat/coronivia/issues/34) - Category multi-select is a mess
* #[33](https://github.com/coolcoastcat/coronivia/issues/33) - UI: Player's panel doesn't fill screen in waiting room
* #[31](https://github.com/coolcoastcat/coronivia/issues/31) - UI: Short question titles have answer wrap up the line
* #[30](https://github.com/coolcoastcat/coronivia/issues/30) - Never let timer show less than 0
* #[29](https://github.com/coolcoastcat/coronivia/issues/29) - Handle disconnect and reconnect
* #[13](https://github.com/coolcoastcat/coronivia/issues/13) - Player Joins after game starts

Enhancements
* #[32](https://github.com/coolcoastcat/coronivia/issues/32) - Turn timer yellow when under 50% remaining and red when under 25% remaining
* #[28](https://github.com/coolcoastcat/coronivia/issues/28) - Show spinner while displaying other dialogs
* #[25](https://github.com/coolcoastcat/coronivia/issues/25) - Add a Coronivia Info Dialog
* #[23](https://github.com/coolcoastcat/coronivia/issues/23) - Add Game Create Feature to pause between rounds
* #[19](https://github.com/coolcoastcat/coronivia/issues/19) - Investigate if there is an easy way to limit categories of questions to a subset. If not, consider pulling a pool of question from mainstream categories. 
* #[18](https://github.com/coolcoastcat/coronivia/issues/18) - Add a check when a user trys to navigate away from the page to warn them they will lose their game.

__v0.0.6__

Bug fixes
* [6 - Fix Unique Key Bug in PlayerListScores](https://github.com/coolcoastcat/coronivia/issues/6)
* [21 - Mobile experience has multiple UI issues](https://github.com/coolcoastcat/coronivia/issues/21)

Enhancements
* Added question above the submitted answer
* Added detection of dev vs prod environments for using different SERVER_URIs


__v0.0.5__

Bug fixes
    * #[11](https://github.com/coolcoastcat/coronivia/issues/11) - Answer shown as correct after a correct answer followed by a no response.
    * Server timer events sent so timers go all the way to zero
* Configured package.json and added `yarn package` script to build the client and stage files in `./public` for deployment to GCP
* App is publicly available at https://coronivia-280216.wm.r.appspot.com/

__v0.0.4__
* Fully implemented Material UI with consistent UI and visual niceties such as countdown timer for questions
* Worked to make dialogs and particularly question text more visible.
* Added form validation

Known Issues
* Some console errors being thrown
* Player leave game isn't working
* After a correct answer submit, a no answer shows as correct
* Joining after the game starts is a bad experience for the joiner

__v0.0.3__
* Steel threaded the game flow for multiple users
* Added Material UI for some components
* Lots of refactoring. Moved classes out of index.js

Known Issues
* UI is a hot mess with lots of experimentation and learning in progress.  Lots of cleanup to be done.  
* User can select an answer and not submit it but the UI says it was on the answer screen
* Dialog messages need to be refined.


__v0.0.2__
* WIP Release - Overview: Substantial progress in creating core artifacts and eventing architecture. Released before creating the game state machine.
* Owners can create / end games 
* Players can join / leave games
* Basic components and real-time event exchanges functional


## How to Contribute
[Contributing to Coronivia](/CONTRIBUTING.md)

For a general overview to contributing to Open Source Projects, [view this guide](https://opensource.guide/how-to-contribute/).

## Tech Stack
* Front end client: [React using JFX](https://reactjs.org/)
* Backend Server: [ExpressJS](https://expressjs.com/)
* Package manager: [yarn](https://yarnpkg.com/)
* Form validation: [React Hook Form](https://react-hook-form.com/)
* Declarative Routing: [React Router](https://reacttraining.com/react-router/web/guides/quick-start)
* Socket.io: [Socket.io](https://socket.io/)
* In-memory database : [PouchDB](https://pouchdb.com/)

### Additional Packages
* [React Confirm Alert](https://www.npmjs.com/package/react-confirm-alert)
* TODO - Add packages

### Other
The project is configured to run both the client and server at the same time. In the development environment, the backend server runs at http://localhost:5000 and the React app is available at http://localhost:3000.

Start the application with:
 ```
    yarn dev
 ```

## Code of Conduct
[Contributor Covenant Code of Conduct](/code_of_conduct.md)

## License 
[![Creative Commons License](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-sa/4.0/)  
This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

## Attribution
This application leverages the trivia database from the [The Open Trivia Database](https://opentdb.com/). It releases the source under [the same license](http://creativecommons.org/licenses/by-sa/4.0/).
Slight changes have been made to the trivia questions to organize categories in a more user friendly hierarchy of category and sub-category. All questions
have been extracted to [opentdb_questions.json](https://github.com/coolcoastcat/coronivia/blob/master/opentdb_questions.json), which contains a brief 
attribution of the questions origin. This attribution should be perpetuated in any derived works using these trivia questions.

## Ideas Parking lot
* All ideas have been created as [GitHub issues](https://github.com/coolcoastcat/coronivia/issues)
