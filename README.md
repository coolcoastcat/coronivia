# coronivia
An open source, online trivia game that friends can play casual trivia games while Zooming, Teaming, Skyping, etc. The name, Coronivia, is a nod to the special times and circumstances that led to the strong need for online distractions with friends, families and colleagues. 

## The Game
Coronivia is a game for 1 to 1 million players (might need some load testing and some sponsored hosting for the million player games). The landing page will have a very simple interface to either:
* __Create a game__

    If you create a game, you are the owner.  Owners get to specify their player name, the number of rounds, number of questions per round and the categories for each round. Number of questions per round ranges from 1 to 50 (see [Open Trivia Database API](https://opentdb.com/) for constraints). Number of rounds will be capped at a sensible 10.

    Additional ideas for room creation: length of countdown timer, allow players to join games in Playing state.

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

## Code of Conduct
[Contributor Covenant Code of Conduct](/code_of_conduct.md)

## License 
[![Creative Commons License](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-sa/4.0/)  
This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

## Attribution
This application leverages the following projects:
* [The Open Trivia Database](https://opentdb.com/)

## Ideas Parking lot
* Chat component for the game room?
* Questions from the API come in easy, medium and hard.  Have different point values for each question type.
* Running total of player points.
* Running total of top N players scores.
* Ability to define different categories for different rounds.