const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server');
const { GraphQLScalarType } = require('graphql');

const books = [
    {
        id: '1',
        title: 'Thank you Lord!',
        color: 'RED',
        authors: [{
            id: '1',
            name: 'Zlantan Otayo',
            phone: '0989374343',
            email: 'zlantan@yahoo.com'
        }]
    },
    {
        id: '2',
        title: 'All i have to say!',
        color: 'BLACK',
        authors: [{
            id: '1',
            name: 'Zlantan Otayo',
            phone: '0989374343',
            email: 'zlantan@yahoo.com'
        }]
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

    type Query {
        getBook(id: String, color: AllowedColor!): Book
        getBooks: [Book]
        getAuthors: [Author]
        search: [Result]
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
            return book;
        },
        getBooks: () => books,
        getAuthors: () => authors,
        search: (_, {}, ctx, info) => {
            return 
        }
    }
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
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives: {
        upper: UpperCaseDirective
    }
});

server.listen().then(({url}) => {
    console.log(`Server started at ${url}...`)
})