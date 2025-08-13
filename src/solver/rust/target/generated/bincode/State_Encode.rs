impl :: bincode :: Encode for State
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        match self
        {
            Self ::ConfigError
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (0u32), encoder) ?
                ; Ok(())
            }, Self ::Uninitialized
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (1u32), encoder) ?
                ; Ok(())
            }, Self ::TreeBuilt
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (2u32), encoder) ?
                ; Ok(())
            }, Self ::MemoryAllocated
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (3u32), encoder) ?
                ; Ok(())
            }, Self ::Solved
            =>{
                < u32 as :: bincode :: Encode >:: encode(& (4u32), encoder) ?
                ; Ok(())
            },
        }
    }
}