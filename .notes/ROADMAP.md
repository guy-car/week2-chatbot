OVERALL GOAL:
Let's identify features missing to feel comfortable enough to add this app to my portfolio.
It doesn't need to be perfect but user experience should be pleasant.
That means:
- do we want users to use the website without being logged in?
- user should be able to log in
- website must look nice
- core functionalities must work and be satisfying

####################
--------------------
####################

Bugs:
- movies without a poster don't have a clickable link
- movies with similar names confuse AI (AI describes the wrong movie or gets the wrong poster)

Evaluate:
- how hard would it be let a non-logged in user use the website but a message pops up when they want to use save to watch list or see their profile etc? Like two different experiences whether they're logged in or not. 
I just want people to be able to try the website as easily as possible.

- what are we looking at when wanting to persist posters / fix how chips appear

####################
--------------------
####################

Auth:
- add login form
- add google sign
- not logged in can still use?

UI:
- consistency of colors 
- better/different genie?
- Dark/light theme toggle
- Delete individual chats
- different post option display (buttons over poster no-good)
- add emojis to chips (or display category name) - improve look in general
- User / Genie messages should look different (different font or something)

UX:
- Loading states during sign-in/chat creation
- Error handling for failed auth/chat operations

DATABASE:
- Rename/edit chat titles

Data flow
- poster persistence
- chips appearing after first message
- posters should always be fetched when a movie is mentionned

AI character:
- too eager to give recommendations
- repeats the same sentences / feels like a bot

####################
--------------------
####################