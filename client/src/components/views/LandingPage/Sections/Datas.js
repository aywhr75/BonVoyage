const continents = [
    {
        "_id": 1,
        "name":"Africa"
    },
    {
        "_id": 2,
        "name": "Europe"
    },
    {
        "_id": 3,
        "name": "Asia"
    },
    {
        "_id": 4,
        "name": "North America"
    },
    {
        "_id": 5,
        "name": "South America"
    },
    {
        "_id": 6,
        "name": "Australia"
    },
    {
        "_id": 7,
        "name": "Antarctica"
    }

]

const price = [
    {
        "_id": 0,
        "name": "Any",
        "array": []
    },
    {
        "_id": 1,
        "name": "$0 to $499",
        "array": [0, 499]
    },
    {
        "_id": 2,
        "name": "$500 to $799",
        "array": [500, 799]
    },
    {
        "_id": 3,
        "name": "$800 to $1119",
        "array": [800, 1119]
    },
    {
        "_id": 4,
        "name": "$1200 to $1599",
        "array": [1200, 1599]
    },
    {
        "_id": 5,
        "name": "More than $1600",
        "array": [1600, 1500000]
    }
]

export {
    continents,
    price
}
