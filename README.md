# coronivia
An open source, online trivia game that friends can play casual trivia games while Zooming, Teaming, Skyping, etc. The name, Coronivia, is a nod to the special times and circumstances that led to the strong need for online distractions with friends, families and colleagues. 

## Releases
__v0.0.6 - Current__
Bug fixes
* [6 - Fix Unique Key Bug in PlayerListScores](https://github.com/coolcoastcat/coronivia/issues/6)
* [21 - Mobile experience has multiple UI issues](https://github.com/coolcoastcat/coronivia/issues/21)

Enhancements
* Added question above the submitted answer
* Added detection of dev vs prod environments for using different SERVER_URIs

Known Issues
* [Issues List](https://github.com/coolcoastcat/coronivia/projects/1?card_filter_query=label%3Abug)

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
This application leverages the following projects:
* [The Open Trivia Database](https://opentdb.com/)

## Ideas Parking lot
* SECURITY: Set a GUID in a cookie for the user. Submit with client API calls to see if this is the same user that joined a game on rejoining.
* FEATURE: Chat component for the game room?
* FEATURE: Add copy to clipboard icon next to room URL
* FEATURE: Questions from the API come in easy, medium and hard.  Have different point values for each question type.
* FEATURE: Running total of player points. - IMPLEMENTED
* FEATURE: Running total of top N players scores. 
* FEATURE: Ability to set question countdown period.
* FEATURE: Ability to set pause at end of Round to have owner click continue (reverts to auto if owner leaves).
* FEATURE: Ability to define different categories for different rounds.
* FEATURE: Ability for Owner to apply a theme to the game
* FEATURE: Show total number of games being played on this server on the landing page
* FEATURE: Allow people to spectate and not play
* AUDIT: Log game data to a server log file.
* SCALABILITY: On owner connection to create game, implement a game-check event, to test if game still exists on server
* FEATURE: Add copy-to-clipboard feature next to URL in Waiting room
* FEATURE: Allow owner to set the maximum number of players
* FEATURE: Implement a score based on the timer 
    * Start with a base score of say 15 and remove answers every five seconds
    * Score drops by five points and finally the answer is all that remains
