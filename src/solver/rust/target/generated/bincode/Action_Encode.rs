impl :: bincode :: Encode for Action
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        match self
        {
            Self ::None
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (0u32), encoder) ?
                ; Ok(())
            }, Self ::Fold
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (1u32), encoder) ?
                ; Ok(())
            }, Self ::Check
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (2u32), encoder) ?
                ; Ok(())
            }, Self ::Call
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (3u32), encoder) ?
                ; Ok(())
            }, Self ::Bet(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (4u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            }, Self ::Raise(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (5u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            }, Self ::AllIn(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (6u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            }, Self ::Chance(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (7u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            },
        }
    }
}