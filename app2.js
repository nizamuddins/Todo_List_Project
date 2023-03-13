module.exports.days = days;

function days(){
    const date = new Date();
    const options={
       weekday: 'long',month: 'long', day: 'numeric' 
    };
    const day = date.toLocaleDateString('en-US',options);

    return day;

}
module.exports.day = day;
function day(){
    const date = new Date();
    const options={
       weekday: 'long', 
    };
    const day = date.toLocaleDateString('en-US',options);

    return day;

}