impl :: bincode :: Encode for CardConfig
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        :: bincode :: Encode :: encode(&self.range, encoder) ?; :: bincode ::
        Encode :: encode(&self.flop, encoder) ?; :: bincode :: Encode ::
        encode(&self.turn, encoder) ?; :: bincode :: Encode ::
        encode(&self.river, encoder) ?; Ok(())
    }
}