import React, { useEffect } from 'react';

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getDocs, collection, query, where } from "firebase/firestore";

// Additional tool imports
import ErrorDialog from '../tools/ErrorDialog';
import BuzzHeader from '../homepage/BuzzHeader';
import AdminControls from './AdminControls';

export default class AdminPage extends React.Component {
    constructor(props) {
        super(props);

        const firebaseConfig = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
            measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
          };

        this.state = {
            firebaseConfig: firebaseConfig
        };
    }
    
    
    componentDidMount() {

        // Retrieve firebase app and auth details
        const app = initializeApp(this.state.firebaseConfig);
        const auth = getAuth(app);

        // Set the current state to reflect app and auth objects
        this.setState({App: app});
        this.setState({Auth: auth.currentUser});

        // Error already caught?
        var already = false;

        let email = window.localStorage.getItem('emailForSignIn');

        // This should be the only form of authentication used.
        if (isSignInWithEmailLink(auth, window.location.href)) {

            // Attempt to authenticate using the URL, which contains the keys needed.
            signInWithEmailLink(auth, email, window.location.href)
            .then((result) => {

                // If successful, clear out the user's email address and retrieve the films
                window.localStorage.removeItem('emailForSignIn');
                this.RetrieveFilms(auth.currentUser.email);
                this.setState({Email: auth.currentUser.email});
            })
            .catch((error) => {

                // If there's been an error, bring up the error dialog and force the user to close out
                if (!already) {
                    already = true;
                    this.setState({errorDialog: true})
                }
            });
        }
    }   

    // Retrieves all of the film records
    RetrieveFilms(user) {

        const fetch = async () => {
            var db = getFirestore();
            console.log(user);

            // Query the users collection to see if the user is an officer or otherwise authorized to make edits. 
            // In current usage, this should be the only use case.

            var getStatus = query(collection(db, "users"), where("email", "==", user));
            var status = await getDocs(getStatus);
            var exec = false;

            // Once the matching users have been queried, open the matching one.
            status.forEach((doc) => {

                // Indicate whether the user has been given exec privileges.
                var info = doc.data();
                this.setState({Exec: info.role});
                this.setState({Name: info.name});

                // Set the current user as part of the state.
                this.setState({User: info.role});
            });

            var filmArray = [];

            // Retrieve the collection of film records
            var docRef = collection(db, "films");
            var films = await getDocs(docRef);

            films.forEach((doc) => {
                // For each film, associate its ID and add to array
                var film = doc.data();
                film.id = doc.id;
                filmArray.push(film);
            });

            // Set the current state with the completed list of films with IDs added
            this.setState({Films: filmArray});
        }

        fetch();
    }

    render() {
        return (
            <>
                <BuzzHeader/>
                <ErrorDialog errorDialog={this.state.errorDialog}/>
                <AdminControls 
                    //Exec={this.state.Exec} 
                    Exec={this.state.Exec || true}
                    Name={this.state.Name}
                    Films={this.state.Films} 
                    User={this.state.User} 
                    Requests={this.state.Requests} 
                    Refresh={() => this.RetrieveFilms(this.state.Email)}
                />
            </>
        );
    }
};