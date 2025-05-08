const createNestedRelationWhereAndConditions = (
    array: string[],
    index = 0,
    condition: Record<string, any> = {},
    value: string
) => {
    condition[array[index]] = {};
    if (index === array.length - 1) {
        condition[array[index]] = value;
    } else {
        createNestedRelationWhereAndConditions(
            array,
            index + 1,
            condition[array[index]],
            value
        );
    }

    console.log(condition);
};
// job.company.profile

createNestedRelationWhereAndConditions(
    ["job", "company", "profile"],
    0,
    {},
    "dhaka"
);