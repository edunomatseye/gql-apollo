const { 
    ApolloServer, 
    gql, 
    SchemaDirectiveVisitor, 
    AuthenticationError,
    UserInputError,
} = require('apollo-server');
const { GraphQLScalarType } = require('graphql');

const books = [
    {
        id: '1',
        title: 'Thank you Lord!',
        color: 'RED',
         
    },
    {
        id: '2',
        title: 'All i have to say!',
        color: 'BLACK',
         
    }
];

const authors = [
    {
        id: '1',
        name: 'Zlantan Otayo',
        phone: '0989374343',
        email: 'zlantan@yahoo.com'
    },
    {
        id: '2',
        name: 'Beyounce Qhyo',
        phone: '08203232323',
        email: 'beyounce@gmail.com'
    }
];

const users = [
    {
        id: '1',
        name: 'Naira Marley',
        phone: '0989374343',
        email: 'zlantan@yahoo.com'
    },
    {
        id: '2',
        name: 'Osunde Peter',
        phone: '08203232323',
        email: 'beyounce@gmail.com'
    }
];

const typeDefs = gql`
    union Result = Book | Author
    directive @upper on FIELD_DEFINITION

    type Book {
        id: String
        title: String
        color: AllowedColor
        authors: [Author]
    }

    enum AllowedColor {
        RED
        GREEN
        WHITE
        YELLOW
        BLACK
    }

    type Author {
        id: String 
        name: String! 
        phone: String 
        email: String
    }

    type User {
        id: String 
        name: String! 
        phone: String 
        email: String
        authors: [Author]
    }

    type File {
        filename: String!
        mimetype: String!
        encoding: String!
    }

    type Post {
        author: String
        comment: String
    }

    type Mutation {
        userInputError(input: String): String
        singleUpload(file: Upload!): File!
        addPost(author: String, comment: String): Post
    }

    type Subscription {
        postAdded: Post
    }

    type Query {
        getBook(id: String, color: AllowedColor!): Book
        getBooks: [Book]
        getAuthors: [Author]
        search: [Result]
        getAppUser(id: String): User
        authenticationError: String
        uploads : [File]
        posts: [Post]
    }
`;

const resolvers = {

    Result: {
        __resolveType : (obj, ctx, info) => {
            if(obj.title){
                return 'Book';
            }
            if(obj.name){
                return 'Author';
            }
            return null
        }
    },

    Query: {
        getBook: (_, { id }, ctx, info) => {
            const book = books.find(book => {
                return book.id == id
            })

            //let introduce some authorization code below:
            if(ctx.user.id != 1) throw Error('Authorization Error')

            //return book object
            return book;
        },
        getBooks: () => books,
        getAuthors: () => authors,
        search: (_, {}, ctx, info) => {
            return 
        },
        authenticationError: (parent, args, context) => {
            throw new AuthenticationError('must authenticate');
        },
        uploads: (_, args, ctx, info) => {
            return
        }
    },

    Book: {
        authors: ({id, title, color}, args, ctx, info) => {

            


            const author = authors.find(a => a.id == id)
            return [author]
        }
    },


    User: {
        authors: ({id, }, args, ctx, info) => {
            const author = authors.find(a => a.id == id)
            return [author]
        }
    },

    Mutation: {
        userInputError: (parent, args, context, info) => {
          if (args.input !== 'expected') {
            throw new UserInputError('Form Arguments invalid', {
              invalidArgs: Object.keys(args),
            });
          }
        },
        singleUpload: (parent, args, ctx, info) => {
            return args.file.then(file => {
                return file
            })
        }
    },

    Subscription: {
        postAdded: {
            //additional event labels can be passed to ascyncIterator creation.
            
        }
    },
}

class UpperCaseDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field){
        const { resolve = defaultFieldResolver } = field;
        field.resolve = async function (...args){
            const result = await resolve.apply(this, args);
            if (typeof result === "string") {
                return result.toUpperCase();
            }
            return result;
        };
    }
};

const getUser = (token, id) => {
    if (token !== 'ADMIN'){
        return 
    }
    return users.find(u => u.id == id)
};

//function to generate User CRUD
const generateUserCRUD = ({ user }) => ({
    getAll : () => {},
    getById: (id) => {},
    getByGroupId: (id) => {}
})

//GraphQL context object
const context = async ({ req, res, connection }) => {

    if(connection){
        return connection.context
    }
    //get the user token from the headers
    const token = req.headers.authentication;
    const uid = req.headers.uid;

    // try to get the USER with the token from the header
    const user = getUser(token, uid);

    //throw an error if user is not found
    //if(!user) throw new AuthenticationError('User Not Found')


    return ({
        user,
        models: {
            userCRUD: generateUserCRUD({ user })
        }
    });
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives: {
        upper: UpperCaseDirective
    },
    context,
    tracing: true,
    engine: {
        apiKey: process.env.ENGINE_API_KEY,
        schemaTag: process.env.ENGINE_SCHEMA_TAG,
    },
    cors: true,
});

server.listen().then(({url}) => {
    console.log(`🚀 Server started at ${url}...`)
})