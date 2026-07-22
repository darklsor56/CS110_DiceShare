# CS110_DiceShare
This is a project for the summer A 2026 course for UCR's CS110. This is a concept of a dice sharing website.

## Local Demo Two-Factor Authentication

After a password is accepted, DiceShare generates a temporary six-digit verification code and prints it in the server terminal. Enter that code on the `/verify-2fa` page within five minutes to finish logging in.

Console delivery is for local demonstration only. It is not appropriate for production because anyone with terminal access can read the code. A production deployment would replace it with a proper authenticator-app TOTP flow or securely delivered email/SMS codes, along with rate limiting and other account protections. Currently looking into a 2FA Authentication App like 2FAS Authenticator.

## **DiceShare** 

A Local TTRPG Dice Trading Platform by Daniel Remedios. 

## **Project Idea and Purpose** 

DiceShare is a “sharing economy” web application designed for local tabletop role-playing game communities, including Dungeons & Dragons, Pathfinder, Call of Cthulhu, Cyberpunk RED, and other TTRPG groups. The main purpose of the website is to allow players to trade dice sets with other local players in their community. 

I find many TTRPG players collect dice, but over time they may end up with extra sets they no longer use, duplicate sets, or dice that do not match their current character or campaign style. At the same time, other players may be looking for unique dice without wanting to buy a brand-new set. Instead of adding more dice to the bag forever, DiceShare creates a local community marketplace where users can post dice sets they want to trade, browse available dice, contact other users, leave reviews, and build trust through ratings. 

The website will focus on trading instead of selling. Users can list dice they own, describe what they are looking for in return, and search for dice based on color, material, condition, and location. The goal of DiceShare is to encourage communities to be more aware of TTRPG players while making it easier for local players to exchange physical dice. 

## **How the System Works** 

Users will be able to register for an account and create a personal profile. Once logged in, a user can create a dice listing by uploading information about a dice set they want to trade. Each listing will include a title, description, dice type, color, material, condition, number of dice, preferred trade, approximate location, and optional images. 

Other users can browse dice listings, search for specific dice, view item details, and express interest in a trade. After a trade happens, users can leave comments and ratings for each other. These reviews help future users decide whether someone is reliable and whether a listed dice set was accurately described. 

DiceShare is intended to be a local community platform, so the site will emphasize nearby trades and community trust. DiceShare’s target audience is primarily D&D groups, Pathfinder groups, university gaming clubs, local game store communities, and general TTRPG players. 

## **Main User Types** 

There will be two main types of users: 

## 1. **Dice Owner / Trader** 

A user who posts dice sets they want to trade. They can create, edit, and delete listings. They can also respond to trade interest from other users. 

## 2. **Dice Browser / Trade Seeker** 

A user who searches through dice listings and looks for sets they may want. They can view details, comment, rate completed trades, and save or request trades. 

A single user can act as both roles. For example, someone can post one dice set for trade while also browsing for another set. 

## **Required System Components** 

## **1. Basic Pages for the Platform** 

The website will include several pages: 

## **Home Page** 

The home page will introduce DiceShare and show featured or recently posted dice listings. It will also include navigation links for logging in, registering, browsing dice, and viewing the user profile. 

## **Browse Listings Page** 

This page will show all available dice listings. Users will be able to filter or search listings by keyword, color, material, condition, dice type, and location. 

## **Dice Listing Detail Page** 

Each dice set will have its own detail page. This page will show the title, images, description, condition, material, color, preferred trade, owner profile, comments, ratings, and similar recommended listings. 

## **Create Listing Page** 

Logged-in users will be able to create a new dice listing. The form will include fields for title, description, category, color, material, condition, number of dice, preferred trade, and location. 

## **Edit / Delete Listing Page** 

The creator of a listing will be able to update or delete their own listing. 

## **User Profile Page** 

Each user will have a profile page showing their username, profile picture, general location, trade history, ratings, general biography,and active dice listings. 

## **Login / Register Page** 

Users will be able to create accounts and log in using a password-based authentication system. 

The system will also support at least one third-party authentication option, such as Google or GitHub sign-in. 

## **Admin Page (optional)** 

If time allows, an admin page will allow a site administrator to view reported listings, remove inappropriate posts, and see basic site statistics. 

## **2. User Profiling** 

Each user will have a profile containing information that helps other users decide whether they want to trade with them. A user profile may include: 

- Username 

- Profile picture or avatar 

- Short bio 

- General location or community area 

- Active dice listings 

- Completed trade count 

- Average rating 

- Comments from previous trades 

Users will also be able to update their own profile information. 

## **3. User Authentication** 

DiceShare will support user registration and login. Users will create an account with an email, username, and password. Passwords will not be stored directly in plain text. Instead, they will be hashed using a secure hashing library such as bcrypt. 

The website will also support at least one third-party authentication method, such as Google sign-in or GitHub sign-in. This satisfies the requirement for password-based authentication plus an additional authentication option. 

Only logged-in users will be able to create listings, edit their own listings, delete their own listings, send trade requests, and leave ratings or comments. 

## **4. Rating and Commenting System** 

After users complete a trade, they will be able to leave a rating and comment. The rating system will use a 1-to-5 star scale. 

Comments will appear on user profiles and possibly on completed listing pages. 

## **5. Database** 

The project will use a database to store important information. I plan to use MongoDB unless I find it too cumbersome to work with, in which I would probably switch to PostgreSQL. 

The database will store: 

- User account information 

- User profile information 

- Dice listings 

- Listing images or image URLs 

- Trade requests 

- Comments 

- Ratings 

Example database collections or tables may include: 

- Users 

- Profiles 

- DiceListings 

- TradeRequests 

- Reviews 

- Comments 

## **6. Search Function** 

The website will include a search feature. Users should be able to search by keywords such as “blue,” “metal,” “dragon,” “D20,” “green,” or “sharp edge.” 

Search filters may include: 

- Dice color 

- Dice material 

- Dice type 

- Condition 

- Number of dice 

- Preferred trade 

- Location 

- Recently posted listings 

## **7. Recommendation System** 

When a user views a dice listing, the system will recommend similar listings based on shared traits. 

The recommendation system may compare: 

- Color 

- Material 

- Dice type 

- Condition 

- Tags 

- Location 

For example, if a user views a red metal dragon-themed dice set, the site may recommend other metal dice, red dice, dragon dice, or listings from nearby users. The recommendation system will rank matching entries based on similarity to the current listing and possibly the user’s profile preferences. 

## **8. Security Requirement** 

One planned security measure that will be addressed is password hashing. User passwords will be hashed most likely using bcrypt before being stored in the database. This helps protect user accounts if the database is ever exposed. 

Other possible security measures I want to include: 

- Input validation to prevent bad or malicious data 

- Protection against cross-site scripting by escaping user-generated content 

- Authorization checks so users can only edit or delete their own listings 

- Secure session handling 

- Sanitizing comments and listing descriptions 

The final project report will document which security issues were addressed and how. 

## **Front End Design** 

The front end will be similar to how I designed the nytimes lab. A header for the homepage, blocks for listings and other minimalist designs unless I have more time to add complexity. Functionality is being prioritized over making the website unique. 

## **Planned Layout** 

## **Home Page Layout** 

- Header with DiceShare logo and navigation 

- Search bar 

- Featured dice listings 

- Recently added listings 

- Button to create a listing 

*Note: “Log in” will change to {USERNAME} and “Sign up” will change to “log out” if logged into an account. 

## **Browse Page Layout** 

- Search bar at the top 

- Filter sidebar or dropdown filters 

- Grid of dice listing cards 

- Each card shows image, title, condition, location, and preferred trade 

*Note: Will store more listing cards on page with set maxes (E.g.: 5/10/20) 

## **Listing Detail Page Layout** 

- Large image of dice set 

- Listing title and description 

- Dice details 

- Owner profile preview 

- Trade request button 

- Comments and ratings 

- Similar recommended listings 

## **Profile Page Layout** 

- User avatar and username 

- Short bio 

- Average rating 

- Active listings 

- Completed trade reviews 

*Note: May swap reviews with active listings. Whatever looks nicer. 

## **Create Listing Page Layout** 

- Form for item details 

- Image upload field or image URL field 

- Submit button 

- Cancel button 

The website will be built to work properly in Google Chrome. I might use Bootstrap or another CSS library to speed up layout development while still customizing the style myself if I find I am in need of fast cosmetics. 

## **Backend Architecture** 

The backend will be built using Node.js with Express.js. The backend will handle routing, authentication, database operations, listing creation, profile updates, ratings, comments, and search requests. 

Planned backend components: 

- Express server 

- Authentication routes 

- User profile routes 

- Dice listing routes 

- Search routes 

- Review and comment routes 

- Recommendation logic 

- Database connection 

- Middleware for authentication and authorization 

The frontend may use server-rendered templates such as EJS or a simple frontend framework, depending on project scope and time. The goal is to keep the project realistic and complete within the available timeline. 

## **Extra Features** 

If time allows, I may add one or more extra features for additional functionality: 

## **Messaging System** 

Users can message each other about a possible trade. May need to prioritize adding if “REQUEST” button is too abstract. 

## **Trade Request System** 

Something to make trades feel more fluid and secure if possible. Would be added after the messaging system. 

## **Favorites / Saved Listings** 

Users can save dice listings they are interested in. 

## **Admin View** 

Admins can remove inappropriate listings, view reported users, and see site statistics. 

## **Composition and Task List** 

Here is the list of what I will generally be doing for this project to be considered complete over the next 2-3 weeks of dev time. 

- Set up Node.js and Express server 

- Design database schema 

- Implement listing CRUD operations 

- Connect backend routes to database 

- Help with security and authentication 

- Create page layouts 

- Build home page, browse page, listing detail page, and profile page 

- Style the website with CSS and/or Bootstrap 

- Make sure the site works properly in Chrome 

- Create mockups or sketches for the proposal and presentation 

- Implement user login and registration 

- Add password hashing and third-party authentication 

- Build ratings and comments 

- Create basic recommendation system 

- Help test user flows 

## **Testing Plan** 

The project will be tested by checking the main user flows: 

1. A user can register and log in. 

2. A user can update their profile. 

3. A user can create a dice listing. 

4. A user can edit and delete their own listing. 

5. Other users can browse and view listings. 

6. Search returns relevant dice listings. 

7. Recommendations appear on item detail pages. 

8. Users can leave ratings and comments after trades. 

9. Unauthorized users cannot edit or delete another user’s listing. 

10. Passwords are securely hashed in the database. 

The tests will happen in Google Chrome to make sure pages display correctly and forms work as expected. Also, I will be utilizing unit tests to ensure consistent quality and for better bug tracking. 

## **Conclusion** 

DiceShare is a local dice trading website for dice collectors who want to exchange dice with others in their community. DiceShare shares and trades physical gaming resources instead of buying new items. It will include user profiles, authentication, dice listings, search, ratings, comments, recommendations, and a database-backed system. I find the idea realistic for the project timeline while still allowing room for extra features such as messaging, trade requests, favorites, and an admin page. 

