impl :: bincode :: Encode for BetSize
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        match self
        {
            Self ::PotRelative(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (0u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            }, Self ::PrevBetRelative(field_0)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (1u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; Ok(())
            }, Self ::Additive(field_0, field_1)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (2u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; ::
                bincode :: Encode :: encode(field_1, encoder) ?; Ok(())
            }, Self ::Geometric(field_0, field_1)
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (3u32), encoder) ?
                ; :: bincode :: Encode :: encode(field_0, encoder) ?; ::
                bincode :: Encode :: encode(field_1, encoder) ?; Ok(())
            }, Self ::AllIn
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (4u32), encoder) ?
                ; Ok(())
            },
        }
    }
}